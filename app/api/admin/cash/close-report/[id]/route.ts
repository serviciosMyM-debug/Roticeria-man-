import { NextRequest } from "next/server";
import PDFDocument from "pdfkit";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = {
  params: Promise<{ id: string }>;
};

function money(value: number) {
  const safe = Number.isFinite(value) ? value : 0;
  return `$ ${safe.toFixed(2)}`;
}

function formatDate(value?: string | Date | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("es-AR");
}

function fmtOrder(value?: number | null) {
  if (!value || value <= 0) return "---";
  return String(value).padStart(3, "0");
}

function num(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function calcSummary(cashRegister: {
  initialAmount: unknown;
  finalAmount: unknown;
  expectedAmount: unknown;
  difference: unknown;
  movements: Array<{ type: string; amount: unknown }>;
}) {
  const initialAmount = num(cashRegister.initialAmount);
  const finalAmount = num(cashRegister.finalAmount);
  const expectedAmount = num(cashRegister.expectedAmount);
  const difference = num(cashRegister.difference);

  const ventas = cashRegister.movements
    .filter((m) => m.type === "SALE")
    .reduce((acc, m) => acc + num(m.amount), 0);

  const ingresos = cashRegister.movements
    .filter((m) => m.type === "INCOME")
    .reduce((acc, m) => acc + num(m.amount), 0);

  const egresos = cashRegister.movements
    .filter((m) => m.type === "EXPENSE")
    .reduce((acc, m) => acc + num(m.amount), 0);

  return {
    initialAmount,
    finalAmount,
    expectedAmount,
    difference,
    ventas,
    ingresos,
    egresos,
  };
}

export async function GET(_: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    const cashRegister = await prisma.cashRegister.findUnique({
      where: { id },
      include: {
        movements: {
          orderBy: { createdAt: "asc" },
        },
        sales: {
          orderBy: { createdAt: "asc" },
          include: {
            order: {
              select: {
                id: true,
                dailyOrderNumber: true,
                customer: {
                  select: { name: true },
                },
              },
            },
          },
        },
      },
    });

    if (!cashRegister) {
      return new Response("Caja no encontrada", { status: 404 });
    }

    if (cashRegister.isOpen) {
      return new Response("La caja todavía está abierta", { status: 400 });
    }

    const summary = calcSummary({
      initialAmount: cashRegister.initialAmount,
      finalAmount: cashRegister.finalAmount,
      expectedAmount: cashRegister.expectedAmount,
      difference: cashRegister.difference,
      movements: cashRegister.movements.map((m) => ({
        type: String(m.type),
        amount: m.amount,
      })),
    });

    const doc = new PDFDocument({
      size: "A4",
      margin: 40,
      info: {
        Title: `Cierre de caja ${formatDate(cashRegister.closedAt)}`,
        Author: "Sistema Mana",
      },
    });

    const chunks: Buffer[] = [];

    const pdfReady = new Promise<Buffer>((resolve, reject) => {
      doc.on("data", (chunk: Buffer | Uint8Array) => {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      });

      doc.on("end", () => {
        resolve(Buffer.concat(chunks));
      });

      doc.on("error", reject);
    });

    // Encabezado
    doc.fontSize(22).text("Resumen de cierre de caja");
    doc.moveDown(0.3);

    doc.fontSize(12);
    doc.text(`ID de caja: ${cashRegister.id}`);
    doc.text(`Apertura: ${formatDate(cashRegister.openedAt)}`);
    doc.text(`Cierre: ${formatDate(cashRegister.closedAt)}`);
    doc.text(`Observación: ${cashRegister.notes || "-"}`);
    doc.moveDown();

    // Resumen general
    doc.fontSize(16).text("Resumen general");
    doc.moveDown(0.5);

    doc.fontSize(11);
    doc.text(`Monto inicial: ${money(summary.initialAmount)}`);
    doc.text(`Ventas confirmadas: ${money(summary.ventas)}`);
    doc.text(`Ingresos manuales: ${money(summary.ingresos)}`);
    doc.text(`Egresos manuales: ${money(summary.egresos)}`);
    doc.text(`Total esperado: ${money(summary.expectedAmount)}`);
    doc.text(`Total contado: ${money(summary.finalAmount)}`);
    doc.text(`Diferencia: ${money(summary.difference)}`);
    doc.moveDown();

    // Lectura
    doc.fontSize(16).text("Lectura del cierre");
    doc.moveDown(0.5);

    doc.fontSize(11);
    if (summary.difference === 0) {
      doc.text("La caja cerró exacta. No hubo diferencia entre lo esperado y lo contado.");
    } else if (summary.difference > 0) {
      doc.text("La caja cerró con sobrante. El dinero contado fue mayor al esperado.");
    } else {
      doc.text("La caja cerró con faltante. El dinero contado fue menor al esperado.");
    }
    doc.moveDown();

    // Ventas
    doc.fontSize(16).text("Ventas por pedido");
    doc.moveDown(0.5);

    if (!cashRegister.sales.length) {
      doc.fontSize(11).text("No hubo ventas confirmadas en esta caja.");
    } else {
      cashRegister.sales.forEach((sale, index) => {
        const orderNumber = fmtOrder(sale.order?.dailyOrderNumber ?? null);
        const customerName = sale.order?.customer?.name || "Cliente sin nombre";
        const total = num(sale.total);
        const paymentMethod = sale.paymentMethod || "-";

        doc.fontSize(11).text(`${index + 1}. Pedido ${orderNumber} - ${customerName}`);
        doc.text(`Fecha: ${formatDate(sale.createdAt)}`);
        doc.text(`Medio de pago: ${paymentMethod}`);
        doc.text(`Total: ${money(total)}`);
        doc.moveDown(0.4);
      });
    }

    doc.moveDown();

    // Movimientos
    doc.fontSize(16).text("Movimientos de caja");
    doc.moveDown(0.5);

    if (!cashRegister.movements.length) {
      doc.fontSize(11).text("No hubo movimientos registrados.");
    } else {
      cashRegister.movements.forEach((movement, index) => {
        doc.fontSize(11).text(`${index + 1}. ${movement.type}`);
        doc.text(`Fecha: ${formatDate(movement.createdAt)}`);
        doc.text(`Monto: ${money(num(movement.amount))}`);
        doc.text(`Descripción: ${movement.description || "-"}`);
        doc.text(`Método: ${movement.method || "-"}`);
        doc.moveDown(0.4);
      });
    }

    doc.moveDown();
    doc.fontSize(10);
    doc.text("Documento generado automáticamente por el sistema de gestión.", {
      align: "center",
    });

    doc.end();

    const pdfBuffer = await pdfReady;

    return new Response(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="cierre-caja-${cashRegister.id}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("GET /api/admin/cash/close-report/[id] error:", error);
    return new Response("No se pudo generar el PDF del cierre", { status: 500 });
  }
}