import { NextRequest } from "next/server";
import PDFDocument from "pdfkit";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = {
  params: Promise<{ id: string }>;
};

function money(value: number) {
  return `$ ${value.toFixed(2)}`;
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

function calcSummary(cashRegister: {
  initialAmount: any;
  finalAmount: any;
  expectedAmount: any;
  difference: any;
  movements: Array<{ type: string; amount: any }>;
}) {
  const initialAmount = Number(cashRegister.initialAmount || 0);
  const finalAmount = Number(cashRegister.finalAmount || 0);
  const expectedAmount = Number(cashRegister.expectedAmount || 0);
  const difference = Number(cashRegister.difference || 0);

  const ventas = cashRegister.movements
    .filter((m) => m.type === "SALE")
    .reduce((acc, m) => acc + Number(m.amount || 0), 0);

  const ingresos = cashRegister.movements
    .filter((m) => m.type === "INCOME")
    .reduce((acc, m) => acc + Number(m.amount || 0), 0);

  const egresos = cashRegister.movements
    .filter((m) => m.type === "EXPENSE")
    .reduce((acc, m) => acc + Number(m.amount || 0), 0);

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

    const summary = calcSummary(cashRegister);

    const doc = new PDFDocument({
      size: "A4",
      margin: 40,
      info: {
        Title: `Cierre de caja ${formatDate(cashRegister.closedAt)}`,
        Author: "Sistema Mana",
      },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));

    const pdfReady = new Promise<Buffer>((resolve, reject) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);
    });

    doc.fontSize(22).font("Helvetica-Bold").text("Resumen de cierre de caja");
    doc.moveDown(0.3);
    doc.fontSize(12).font("Helvetica");
    doc.text(`ID de caja: ${cashRegister.id}`);
    doc.text(`Apertura: ${formatDate(cashRegister.openedAt)}`);
    doc.text(`Cierre: ${formatDate(cashRegister.closedAt)}`);
    doc.text(`Observación: ${cashRegister.notes || "-"}`);
    doc.moveDown();

    doc.fontSize(16).font("Helvetica-Bold").text("Resumen general");
    doc.moveDown(0.5);
    doc.fontSize(11).font("Helvetica");
    doc.text(`Monto inicial: ${money(summary.initialAmount)}`);
    doc.text(`Ventas confirmadas: ${money(summary.ventas)}`);
    doc.text(`Ingresos manuales: ${money(summary.ingresos)}`);
    doc.text(`Egresos manuales: ${money(summary.egresos)}`);
    doc.text(`Total esperado: ${money(summary.expectedAmount)}`);
    doc.text(`Total contado: ${money(summary.finalAmount)}`);
    doc.text(`Diferencia: ${money(summary.difference)}`);
    doc.moveDown();

    doc.fontSize(16).font("Helvetica-Bold").text("Lectura del cierre");
    doc.moveDown(0.5);
    doc.fontSize(11).font("Helvetica");
    if (summary.difference === 0) {
      doc.text("La caja cerró exacta. No hubo diferencia entre lo esperado y lo contado.");
    } else if (summary.difference > 0) {
      doc.text("La caja cerró con sobrante. El dinero contado fue mayor al esperado.");
    } else {
      doc.text("La caja cerró con faltante. El dinero contado fue menor al esperado.");
    }
    doc.moveDown();

    doc.fontSize(16).font("Helvetica-Bold").text("Ventas por pedido");
    doc.moveDown(0.5);

    if (cashRegister.sales.length === 0) {
      doc.fontSize(11).font("Helvetica").text("No hubo ventas confirmadas en esta caja.");
    } else {
      cashRegister.sales.forEach((sale, index) => {
        doc
          .fontSize(11)
          .font("Helvetica-Bold")
          .text(
            `${index + 1}. Pedido ${fmtOrder(sale.order.dailyOrderNumber)} - ${sale.order.customer.name}`
          );
        doc.font("Helvetica");
        doc.text(`Fecha: ${formatDate(sale.createdAt)}`);
        doc.text(`Medio de pago: ${sale.paymentMethod}`);
        doc.text(`Total: ${money(Number(sale.total || 0))}`);
        doc.moveDown(0.4);
      });
    }

    doc.moveDown();

    doc.fontSize(16).font("Helvetica-Bold").text("Movimientos de caja");
    doc.moveDown(0.5);

    if (cashRegister.movements.length === 0) {
      doc.fontSize(11).font("Helvetica").text("No hubo movimientos registrados.");
    } else {
      cashRegister.movements.forEach((movement, index) => {
        doc
          .fontSize(11)
          .font("Helvetica-Bold")
          .text(`${index + 1}. ${movement.type}`);
        doc.font("Helvetica");
        doc.text(`Fecha: ${formatDate(movement.createdAt)}`);
        doc.text(`Monto: ${money(Number(movement.amount || 0))}`);
        doc.text(`Descripción: ${movement.description || "-"}`);
        doc.text(`Método: ${movement.method || "-"}`);
        doc.moveDown(0.4);
      });
    }

    doc.moveDown();
    doc.fontSize(10).font("Helvetica-Oblique");
    doc.text("Documento generado automáticamente por el sistema de gestión.", {
      align: "center",
    });

    doc.end();

    const pdfBuffer = await pdfReady;

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="cierre-caja-${cashRegister.id}.pdf"`,
      },
    });
  } catch (error) {
    console.error("GET /api/admin/cash/close-report/[id] error:", error);
    return new Response("No se pudo generar el PDF del cierre", { status: 500 });
  }
}