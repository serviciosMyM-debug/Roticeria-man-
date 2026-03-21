import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CashMovementType, PaymentMethod } from "@prisma/client";
import { z } from "zod";

const openSchema = z.object({
  action: z.literal("open"),
  initialAmount: z.coerce.number().min(0),
  notes: z.string().optional(),
});

const movementSchema = z.object({
  action: z.literal("movement"),
  type: z.enum(["INCOME", "EXPENSE"]),
  amount: z.coerce.number().positive(),
  method: z.enum(["CASH", "TRANSFER", "DEBIT", "CREDIT"]).optional(),
  description: z.string().min(2),
});

const closeSchema = z.object({
  action: z.literal("close"),
  finalAmount: z.coerce.number().min(0),
  notes: z.string().optional(),
});

export async function GET() {
  try {
    const current = await prisma.cashRegister.findFirst({
      where: { isOpen: true },
      include: {
        movements: {
          orderBy: { createdAt: "desc" },
        },
        sales: true,
      },
    });

    const history = await prisma.cashRegister.findMany({
      take: 15,
      orderBy: { openedAt: "desc" },
      include: {
        movements: true,
        sales: true,
      },
    });

    return NextResponse.json({ current, history });
  } catch (error) {
    return NextResponse.json(
      { error: "No se pudo obtener la caja", detail: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.action === "open") {
      const parsed = openSchema.parse(body);

      const existing = await prisma.cashRegister.findFirst({
        where: { isOpen: true },
      });

      if (existing) {
        return NextResponse.json(
          { error: "Ya hay una caja abierta" },
          { status: 400 }
        );
      }

      const register = await prisma.cashRegister.create({
        data: {
          openedAt: new Date(),
          initialAmount: parsed.initialAmount,
          isOpen: true,
          notes: parsed.notes || null,
        },
      });

      await prisma.cashMovement.create({
        data: {
          cashRegisterId: register.id,
          type: CashMovementType.OPENING,
          amount: parsed.initialAmount,
          description: "Apertura de caja",
        },
      });

      return NextResponse.json({ ok: true, register });
    }

    if (body.action === "movement") {
      const parsed = movementSchema.parse(body);

      const register = await prisma.cashRegister.findFirst({
        where: { isOpen: true },
      });

      if (!register) {
        return NextResponse.json(
          { error: "No hay caja abierta" },
          { status: 400 }
        );
      }

      const movementType =
        parsed.type === "INCOME"
          ? CashMovementType.INCOME
          : CashMovementType.EXPENSE;

      const movement = await prisma.cashMovement.create({
        data: {
          cashRegisterId: register.id,
          type: movementType,
          amount: parsed.amount,
          method: parsed.method ? (parsed.method as PaymentMethod) : null,
          description: parsed.description,
        },
      });

      return NextResponse.json({ ok: true, movement });
    }

    if (body.action === "close") {
      const parsed = closeSchema.parse(body);

      const register = await prisma.cashRegister.findFirst({
        where: { isOpen: true },
        include: { movements: true, sales: true },
      });

      if (!register) {
        return NextResponse.json(
          { error: "No hay caja abierta" },
          { status: 400 }
        );
      }

      let expected =
        Number(register.initialAmount) +
        register.movements.reduce((acc, m) => {
          const amount = Number(m.amount);

          if (m.type === "SALE" || m.type === "INCOME") return acc + amount;
          if (m.type === "EXPENSE") return acc - amount;
          return acc;
        }, 0);

      const difference = parsed.finalAmount - expected;

      const updated = await prisma.cashRegister.update({
        where: { id: register.id },
        data: {
          closedAt: new Date(),
          finalAmount: parsed.finalAmount,
          expectedAmount: expected,
          difference,
          isOpen: false,
          notes: parsed.notes || register.notes,
        },
      });

      await prisma.cashMovement.create({
        data: {
          cashRegisterId: register.id,
          type: CashMovementType.CLOSING,
          amount: parsed.finalAmount,
          description: "Cierre de caja",
        },
      });

      return NextResponse.json({ ok: true, register: updated });
    }

    return NextResponse.json(
      { error: "Acción inválida" },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "No se pudo procesar la caja", detail: String(error) },
      { status: 400 }
    );
  }
}