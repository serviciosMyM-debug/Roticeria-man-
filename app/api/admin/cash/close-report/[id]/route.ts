import { NextRequest } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
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

function wrapText(text: string, maxLength = 95) {
  if (!text) return ["-"];
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxLength) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) lines.push(current);
  return lines.length ? lines : ["-"];
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

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let page = pdfDoc.addPage([595.28, 841.89]); // A4
    const { width, height } = page.getSize();
    const margin = 40;
    let y = height - margin;

    const line = (text: string, size = 11, isBold = false, gap = 16) => {
      const activeFont = isBold ? bold : font;
      if (y < 60) {
        page = pdfDoc.addPage([595.28, 841.89]);
        y = height - margin;
      }
      page.drawText(text, {
        x: margin,
        y,
        size,
        font: activeFont,
        color: rgb(0, 0, 0),
      });
      y -= gap;
    };

    const wrapped = (text: string, size = 11, isBold = false, gap = 14) => {
      for (const item of wrapText(text)) {
        line(item, size, isBold, gap);
      }
    };

    line("Resumen de cierre de caja", 22, true, 24);
    y -= 4;

    line(`ID de caja: ${cashRegister.id}`);
    line(`Apertura: ${formatDate(cashRegister.openedAt)}`);
    line(`Cierre: ${formatDate(cashRegister.closedAt)}`);
    wrapped(`Observación: ${cashRegister.notes || "-"}`);
    y -= 8;

    line("Resumen general", 16, true, 20);
    line(`Monto inicial: ${money(summary.initialAmount)}`);
    line(`Ventas confirmadas: ${money(summary.ventas)}`);
    line(`Ingresos manuales: ${money(summary.ingresos)}`);
    line(`Egresos manuales: ${money(summary.egresos)}`);
    line(`Total esperado: ${money(summary.expectedAmount)}`);
    line(`Total contado: ${money(summary.finalAmount)}`);
    line(`Diferencia: ${money(summary.difference)}`);
    y -= 8;

    line("Lectura del cierre", 16, true, 20);
    if (summary.difference === 0) {
      wrapped("La caja cerró exacta. No hubo diferencia entre lo esperado y lo contado.");
    } else if (summary.difference > 0) {
      wrapped("La caja cerró con sobrante. El dinero contado fue mayor al esperado.");
    } else {
      wrapped("La caja cerró con faltante. El dinero contado fue menor al esperado.");
    }
    y -= 8;

    line("Ventas por pedido", 16, true, 20);
    if (!cashRegister.sales.length) {
      line("No hubo ventas confirmadas en esta caja.");
    } else {
      cashRegister.sales.forEach((sale, index) => {
        const orderNumber = fmtOrder(sale.order?.dailyOrderNumber ?? null);
        const customerName = sale.order?.customer?.name || "Cliente sin nombre";
        const total = num(sale.total);
        const paymentMethod = sale.paymentMethod || "-";

        line(`${index + 1}. Pedido ${orderNumber} - ${customerName}`, 11, true);
        line(`Fecha: ${formatDate(sale.createdAt)}`);
        line(`Medio de pago: ${paymentMethod}`);
        line(`Total: ${money(total)}`);
        y -= 4;
      });
    }

    y -= 8;
    line("Movimientos de caja", 16, true, 20);
    if (!cashRegister.movements.length) {
      line("No hubo movimientos registrados.");
    } else {
      cashRegister.movements.forEach((movement, index) => {
        line(`${index + 1}. ${movement.type}`, 11, true);
        line(`Fecha: ${formatDate(movement.createdAt)}`);
        line(`Monto: ${money(num(movement.amount))}`);
        wrapped(`Descripción: ${movement.description || "-"}`);
        line(`Método: ${movement.method || "-"}`);
        y -= 4;
      });
    }

    if (y < 60) {
      page = pdfDoc.addPage([595.28, 841.89]);
      y = height - margin;
    }
    page.drawText("Documento generado automáticamente por el sistema de gestión.", {
      x: margin,
      y: 30,
      size: 10,
      font,
      color: rgb(0.2, 0.2, 0.2),
    });

    const pdfBytes = await pdfDoc.save();

    return new Response(pdfBytes as unknown as BodyInit, {
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