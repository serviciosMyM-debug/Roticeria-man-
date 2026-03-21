import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PaymentMethod, OrderStatus } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { z } from "zod";

const checkoutSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(6),
  address: z.string().optional().nullable(),
  deliveryType: z.enum(["delivery", "pickup"]),
  notes: z.string().optional().nullable(),
  paymentMethod: z.enum(["CASH", "TRANSFER", "DEBIT", "CREDIT"]),
  items: z
    .array(
      z.object({
        productId: z.string(),
        quantity: z.number().int().min(1),
      })
    )
    .min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const normalizedBody = {
      ...body,
      name: body.name ?? body.customerName ?? "",
      phone: body.phone ?? "",
      address: body.address ?? null,
      deliveryType: normalizeDeliveryType(body.deliveryType),
      notes: body.notes ?? body.observations ?? null,
      paymentMethod: normalizePaymentMethod(body.paymentMethod),
      items: Array.isArray(body.items)
        ? body.items.map((item: any) => ({
            productId: String(item.productId),
            quantity: Number(item.quantity),
          }))
        : [],
    };

    const parsed = checkoutSchema.parse(normalizedBody);

    const result = await prisma.$transaction(async (tx) => {
      const productIds = parsed.items.map((i) => i.productId);

      const products = await tx.product.findMany({
        where: {
          id: { in: productIds },
          isActive: true,
        },
      });

      if (products.length !== productIds.length) {
        throw new Error("Uno o más productos no existen o están inactivos.");
      }

      for (const item of parsed.items) {
        const product = products.find((p) => p.id === item.productId);
        if (!product) throw new Error("Producto inexistente.");

        if (product.stock < item.quantity) {
          throw new Error(
            `Stock insuficiente para ${product.name}. Disponible: ${product.stock}`
          );
        }
      }

      const customer = await tx.customer.create({
        data: {
          name: parsed.name,
          phone: parsed.phone,
          address: parsed.address || null,
        },
      });

      const lines = parsed.items.map((item) => {
        const product = products.find((p) => p.id === item.productId)!;
        const unitPrice = Number(product.promoPrice ?? product.price);
        const subtotal = unitPrice * item.quantity;

        return {
          product,
          quantity: item.quantity,
          unitPrice,
          subtotal,
        };
      });

      const total = lines.reduce((acc, line) => acc + line.subtotal, 0);

      const now = new Date();
      const orderDateKey = getOrderDateKey(now);

      const todayOrdersCount = await tx.order.count({
        where: {
          orderDateKey,
        },
      });

      const dailyOrderNumber = todayOrdersCount + 1;

      const order = await tx.order.create({
        data: {
          customerId: customer.id,
          orderDateKey,
          dailyOrderNumber,
          status: OrderStatus.PENDING,
          paymentMethod: parsed.paymentMethod as PaymentMethod,
          subtotal: new Prisma.Decimal(total),
          total: new Prisma.Decimal(total),
          notes: parsed.notes || null,
          deliveryType: parsed.deliveryType,
          deliveryAddress:
            parsed.deliveryType === "delivery" ? parsed.address || null : null,
          items: {
            create: lines.map((line) => ({
              productId: line.product.id,
              name: line.product.name,
              unitPrice: new Prisma.Decimal(line.unitPrice),
              quantity: line.quantity,
              subtotal: new Prisma.Decimal(line.subtotal),
            })),
          },
        },
        include: {
          items: true,
          customer: true,
        },
      });

      for (const line of lines) {
        await tx.product.update({
          where: { id: line.product.id },
          data: {
            stock: {
              decrement: line.quantity,
            },
          },
        });

        await tx.stockMovement.create({
          data: {
            productId: line.product.id,
            type: "SALE",
            quantity: -line.quantity,
            note: `Descuento por pedido ${formatDailyOrderNumber(order.dailyOrderNumber)}`,
          },
        });
      }

      return { order, lines, total };
    });

    const displayOrderNumber = formatDailyOrderNumber(result.order.dailyOrderNumber);

    const whatsappMessage = [
      "Hola! Quiero confirmar este pedido:",
      `Pedido: ${displayOrderNumber}`,
      `Cliente: ${parsed.name}`,
      `Teléfono: ${parsed.phone}`,
      `Entrega: ${
        parsed.deliveryType === "delivery" ? "Delivery" : "Retiro en local"
      }`,
      `Dirección: ${parsed.address || "-"}`,
      `Pago: ${humanPaymentMethod(parsed.paymentMethod)}`,
      "",
      "Productos:",
      ...result.lines.map(
        (line) =>
          `- ${line.product.name} x${line.quantity} = $${line.subtotal.toFixed(2)}`
      ),
      "",
      `Observaciones: ${parsed.notes || "-"}`,
      "",
      `TOTAL: $${result.total.toFixed(2)}`,
    ].join("\n");

    return NextResponse.json({
      ok: true,
      orderId: result.order.id,
      displayOrderNumber,
      total: result.total,
      whatsappMessage,
    });
  } catch (error: any) {
    console.error("POST /api/orders error:", error);

    if (error?.issues) {
      return NextResponse.json(
        {
          error: "Datos inválidos en el checkout",
          issues: error.issues,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "No se pudo generar el pedido",
      },
      { status: 400 }
    );
  }
}

function normalizePaymentMethod(value: unknown): "CASH" | "TRANSFER" | "DEBIT" | "CREDIT" {
  const raw = String(value || "")
    .trim()
    .toUpperCase();

  switch (raw) {
    case "CASH":
    case "EFECTIVO":
      return "CASH";
    case "TRANSFER":
    case "TRANSFERENCIA":
      return "TRANSFER";
    case "DEBIT":
    case "DEBITO":
    case "DÉBITO":
      return "DEBIT";
    case "CREDIT":
    case "CREDITO":
    case "CRÉDITO":
      return "CREDIT";
    default:
      return "CASH";
  }
}

function normalizeDeliveryType(value: unknown): "delivery" | "pickup" {
  const raw = String(value || "")
    .trim()
    .toLowerCase();

  if (raw === "pickup" || raw === "retiro" || raw === "retiro-en-local") {
    return "pickup";
  }

  return "delivery";
}

function humanPaymentMethod(value: string) {
  switch (value) {
    case "CASH":
      return "Efectivo";
    case "TRANSFER":
      return "Transferencia";
    case "DEBIT":
      return "Débito";
    case "CREDIT":
      return "Crédito";
    default:
      return value;
  }
}

function getOrderDateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDailyOrderNumber(value: number) {
  return value.toString().padStart(3, "0");
}