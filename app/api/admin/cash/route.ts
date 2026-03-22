import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CashMovementType, PaymentMethod } from "@prisma/client";
import { Prisma } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toDecimal(value: unknown) {
  const num = Number(value ?? 0);
  return new Prisma.Decimal(Number.isFinite(num) ? num : 0);
}

function formatOrderNumber(value?: number | null) {
  if (!value || value <= 0) return "---";
  return String(value).padStart(3, "0");
}

export async function GET() {
  try {
    const currentCash = await prisma.cashRegister.findFirst({
      where: {
        isOpen: true,
      },
      orderBy: {
        openedAt: "desc",
      },
      include: {
        movements: {
          orderBy: {
            createdAt: "desc",
          },
        },
        sales: {
          orderBy: {
            createdAt: "desc",
          },
          include: {
            order: {
              select: {
                id: true,
                dailyOrderNumber: true,
                customer: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const lastClosedCash = await prisma.cashRegister.findFirst({
      where: {
        isOpen: false,
      },
      orderBy: {
        closedAt: "desc",
      },
      include: {
        movements: {
          orderBy: {
            createdAt: "desc",
          },
        },
        sales: {
          orderBy: {
            createdAt: "desc",
          },
          include: {
            order: {
              select: {
                id: true,
                dailyOrderNumber: true,
                customer: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    function buildSummary(cashRegister: typeof currentCash | typeof lastClosedCash | null) {
      if (!cashRegister) {
        return {
          initialAmount: 0,
          ingresos: 0,
          egresos: 0,
          ventas: 0,
          expectedAmount: 0,
          finalAmount: 0,
          difference: 0,
        };
      }

      const initialAmount = Number(cashRegister.initialAmount);

      const ventas = cashRegister.movements
        .filter((m) => m.type === CashMovementType.SALE)
        .reduce((acc, m) => acc + Number(m.amount), 0);

      const ingresos = cashRegister.movements
        .filter((m) => m.type === CashMovementType.INCOME)
        .reduce((acc, m) => acc + Number(m.amount), 0);

      const egresos = cashRegister.movements
        .filter((m) => m.type === CashMovementType.EXPENSE)
        .reduce((acc, m) => acc + Number(m.amount), 0);

      const expectedAmount = initialAmount + ventas + ingresos - egresos;
      const finalAmount = cashRegister.finalAmount ? Number(cashRegister.finalAmount) : 0;
      const difference = cashRegister.difference ? Number(cashRegister.difference) : 0;

      return {
        initialAmount,
        ingresos,
        egresos,
        ventas,
        expectedAmount,
        finalAmount,
        difference,
      };
    }

    function serializeCash(cashRegister: typeof currentCash | typeof lastClosedCash | null) {
      if (!cashRegister) return null;

      return {
        ...cashRegister,
        sales: cashRegister.sales.map((sale) => ({
          id: sale.id,
          createdAt: sale.createdAt,
          total: Number(sale.total),
          paymentMethod: sale.paymentMethod,
          order: {
            id: sale.order.id,
            dailyOrderNumber: sale.order.dailyOrderNumber,
            displayNumber: formatOrderNumber(sale.order.dailyOrderNumber),
            customerName: sale.order.customer.name,
          },
        })),
        movements: cashRegister.movements.map((m) => ({
          ...m,
          amount: Number(m.amount),
        })),
      };
    }

    return NextResponse.json({
      ok: true,
      isOpen: Boolean(currentCash),
      cashRegister: serializeCash(currentCash),
      summary: buildSummary(currentCash),
      lastClosedCash: serializeCash(lastClosedCash),
      lastClosedSummary: buildSummary(lastClosedCash),
    });
  } catch (error) {
    console.error("GET /api/admin/cash error:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "No se pudo obtener la caja",
        detail: String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = String(body.action || "").trim().toLowerCase();

    if (!["open", "income", "expense", "close"].includes(action)) {
      return NextResponse.json(
        { ok: false, error: "Acción inválida" },
        { status: 400 }
      );
    }

    if (action === "open") {
      const existing = await prisma.cashRegister.findFirst({
        where: { isOpen: true },
      });

      if (existing) {
        return NextResponse.json(
          { ok: false, error: "Ya hay una caja abierta." },
          { status: 400 }
        );
      }

      const initialAmount = toDecimal(body.initialAmount);

      const cashRegister = await prisma.cashRegister.create({
        data: {
          openedAt: new Date(),
          initialAmount,
          isOpen: true,
          notes: body.notes ? String(body.notes) : null,
        },
      });

      await prisma.cashMovement.create({
        data: {
          cashRegisterId: cashRegister.id,
          type: CashMovementType.OPENING,
          amount: initialAmount,
          description: "Apertura de caja",
        },
      });

      return NextResponse.json({
        ok: true,
        message: "Caja abierta correctamente.",
      });
    }

    const cashRegister = await prisma.cashRegister.findFirst({
      where: { isOpen: true },
      include: {
        movements: true,
      },
      orderBy: {
        openedAt: "desc",
      },
    });

    if (!cashRegister) {
      return NextResponse.json(
        { ok: false, error: "No hay una caja abierta." },
        { status: 400 }
      );
    }

    if (action === "income") {
      const amount = toDecimal(body.amount);
      const description = String(body.description || "Ingreso manual");

      if (Number(amount) <= 0) {
        return NextResponse.json(
          { ok: false, error: "El ingreso debe ser mayor a 0." },
          { status: 400 }
        );
      }

      await prisma.cashMovement.create({
        data: {
          cashRegisterId: cashRegister.id,
          type: CashMovementType.INCOME,
          amount,
          description,
          method: body.method
            ? (String(body.method).toUpperCase() as PaymentMethod)
            : null,
        },
      });

      return NextResponse.json({
        ok: true,
        message: "Ingreso registrado correctamente.",
      });
    }

    if (action === "expense") {
      const amount = toDecimal(body.amount);
      const description = String(body.description || "Egreso manual");

      if (Number(amount) <= 0) {
        return NextResponse.json(
          { ok: false, error: "El egreso debe ser mayor a 0." },
          { status: 400 }
        );
      }

      await prisma.cashMovement.create({
        data: {
          cashRegisterId: cashRegister.id,
          type: CashMovementType.EXPENSE,
          amount,
          description,
          method: body.method
            ? (String(body.method).toUpperCase() as PaymentMethod)
            : null,
        },
      });

      return NextResponse.json({
        ok: true,
        message: "Egreso registrado correctamente.",
      });
    }

    if (action === "close") {
      const finalAmount = toDecimal(body.finalAmount);
      const closeNotes = body.notes ? String(body.notes) : null;

      const initialAmount = Number(cashRegister.initialAmount);

      const ventas = cashRegister.movements
        .filter((m) => m.type === CashMovementType.SALE)
        .reduce((acc, m) => acc + Number(m.amount), 0);

      const ingresos = cashRegister.movements
        .filter((m) => m.type === CashMovementType.INCOME)
        .reduce((acc, m) => acc + Number(m.amount), 0);

      const egresos = cashRegister.movements
        .filter((m) => m.type === CashMovementType.EXPENSE)
        .reduce((acc, m) => acc + Number(m.amount), 0);

      const expectedAmount = initialAmount + ventas + ingresos - egresos;
      const difference = Number(finalAmount) - expectedAmount;

      await prisma.cashMovement.create({
        data: {
          cashRegisterId: cashRegister.id,
          type: CashMovementType.CLOSING,
          amount: finalAmount,
          description: "Cierre de caja",
        },
      });

      await prisma.cashRegister.update({
        where: { id: cashRegister.id },
        data: {
          isOpen: false,
          closedAt: new Date(),
          finalAmount,
          expectedAmount: new Prisma.Decimal(expectedAmount),
          difference: new Prisma.Decimal(difference),
          notes: closeNotes || cashRegister.notes,
        },
      });

      return NextResponse.json({
        ok: true,
        message: "Caja cerrada correctamente.",
      });
    }

    return NextResponse.json(
      { ok: false, error: "Acción no soportada." },
      { status: 400 }
    );
  } catch (error) {
    console.error("POST /api/admin/cash error:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "No se pudo procesar la acción de caja",
        detail: String(error),
      },
      { status: 500 }
    );
  }
}