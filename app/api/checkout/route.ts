import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PaymentMethod, OrderStatus, CashMovementType } from "@prisma/client";
import { z } from "zod";
import { Prisma } from "@prisma/client";

const checkoutSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(6),
  address: z.string().optional().nullable(),
  deliveryType: z.enum(["delivery", "pickup"]),
  notes: z.string().optional().nullable(),
  paymentMethod: z.enum(["CASH", "TRANSFER", "DEBIT", "CREDIT"]),
  items: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number().int().min(1),
    })
  ).min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = checkoutSchema.parse(body);

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
          throw new Error(`Stock insuficiente para ${product.name}. Disponible: ${product.stock}`);
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

      const order = await tx.order.create({
        data: {
          customerId: customer.id,
          status: OrderStatus.PENDING,
          paymentMethod: parsed.paymentMethod as PaymentMethod,
          subtotal: total,
          total,
          notes: parsed.notes || null,
          deliveryType: parsed.deliveryType,
          deliveryAddress: parsed.deliveryType === "delivery" ? parsed.address || null : null,
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
            note: `Descuento por pedido ${order.id}`,
          },
        });
      }

      const openRegister = await tx.cashRegister.findFirst({
        where: { isOpen: true },
      });

      const sale = await tx.sale.create({
        data: {
          orderId: order.id,
          cashRegisterId: openRegister?.id || null,
          paymentMethod: parsed.paymentMethod as PaymentMethod,
          total: new Prisma.Decimal(total),
        },
      });

      if (openRegister) {
        await tx.cashMovement.create({
          data: {
            cashRegisterId: openRegister.id,
            type: CashMovementType.SALE,
            method: parsed.paymentMethod as PaymentMethod,
            amount: new Prisma.Decimal(total),
            description: `Venta asociada al pedido ${order.id}`,
          },
        });
      }

      return { order, sale, lines, total };
    });

    return NextResponse.json({
      ok: true,
      orderId: result.order.id,
      total: result.total,
      whatsappMessage: buildWhatsAppMessage({
        orderId: result.order.id,
        name: parsed.name,
        phone: parsed.phone,
        address: parsed.address || "",
        deliveryType: parsed.deliveryType,
        paymentMethod: parsed.paymentMethod,
        notes: parsed.notes || "",
        items: result.lines.map((l) => ({
          name: l.product.name,
          quantity: l.quantity,
          subtotal: l.subtotal,
        })),
        total: result.total,
      }),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "No se pudo generar el pedido",
      },
      { status: 400 }
    );
  }
}

function buildWhatsAppMessage(data: {
  orderId: string;
  name: string;
  phone: string;
  address: string;
  deliveryType: string;
  paymentMethod: string;
  notes: string;
  items: { name: string; quantity: number; subtotal: number }[];
  total: number;
}) {
  const lines = data.items
    .map((i) => `- ${i.name} x${i.quantity} = $${i.subtotal}`)
    .join("\n");

  return `Hola! Quiero confirmar este pedido:
Pedido: ${data.orderId}
Cliente: ${data.name}
Teléfono: ${data.phone}
Entrega: ${data.deliveryType === "delivery" ? "Delivery" : "Retiro en local"}
Dirección: ${data.address || "-"}
Pago: ${data.paymentMethod}

Productos:
${lines}

Observaciones: ${data.notes || "-"}

TOTAL: $${data.total}`;
}