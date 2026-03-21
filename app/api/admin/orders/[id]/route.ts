import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CashMovementType, OrderStatus } from "@prisma/client";
import { Prisma } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = {
  params: Promise<{ id: string }>;
};

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const action = String(body.action || "").trim().toLowerCase();

    if (!["complete", "cancel"].includes(action)) {
      return NextResponse.json(
        { ok: false, error: "Acción inválida" },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id },
        include: {
          items: true,
          sale: true,
        },
      });

      if (!order) {
        throw new Error("Pedido no encontrado");
      }

      if (action === "complete") {
        if (order.status === OrderStatus.DELIVERED) {
          return order;
        }

        let sale = order.sale;

        if (!sale) {
          const openCash = await tx.cashRegister.findFirst({
            where: { isOpen: true },
            orderBy: { openedAt: "desc" },
          });

          sale = await tx.sale.create({
            data: {
              orderId: order.id,
              cashRegisterId: openCash?.id || null,
              paymentMethod: order.paymentMethod,
              total: order.total,
            },
          });

          if (openCash) {
            await tx.cashMovement.create({
              data: {
                cashRegisterId: openCash.id,
                type: CashMovementType.SALE,
                method: order.paymentMethod,
                amount: order.total,
                description: `Pedido ${String(order.dailyOrderNumber).padStart(3, "0")}`,
              },
            });
          }
        }

        return await tx.order.update({
          where: { id: order.id },
          data: {
            status: OrderStatus.DELIVERED,
          },
          include: {
            customer: true,
            items: true,
            sale: true,
          },
        });
      }

      if (action === "cancel") {
        if (order.status !== OrderStatus.CANCELLED) {
          for (const item of order.items) {
            if (item.productId) {
              await tx.product.update({
                where: { id: item.productId },
                data: {
                  stock: {
                    increment: item.quantity,
                  },
                },
              });

              await tx.stockMovement.create({
                data: {
                  productId: item.productId,
                  type: "CANCEL_RESTORE",
                  quantity: item.quantity,
                  note: `Restaurado por cancelación pedido ${String(order.dailyOrderNumber).padStart(3, "0")}`,
                },
              });
            }
          }
        }

        return await tx.order.update({
          where: { id: order.id },
          data: {
            status: OrderStatus.CANCELLED,
          },
          include: {
            customer: true,
            items: true,
            sale: true,
          },
        });
      }

      throw new Error("Acción no soportada");
    });

    return NextResponse.json({
      ok: true,
      order: result,
    });
  } catch (error) {
    console.error("PATCH /api/admin/orders/[id] error:", error);

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "No se pudo actualizar el pedido",
      },
      { status: 400 }
    );
  }
}

export async function DELETE(_: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id },
        include: {
          items: true,
          sale: true,
        },
      });

      if (!order) {
        throw new Error("Pedido no encontrado");
      }

      if (order.status !== OrderStatus.CANCELLED && order.status !== OrderStatus.DELIVERED) {
        for (const item of order.items) {
          if (item.productId) {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stock: {
                  increment: item.quantity,
                },
              },
            });

            await tx.stockMovement.create({
              data: {
                productId: item.productId,
                type: "DELETE_RESTORE",
                quantity: item.quantity,
                note: `Restaurado por eliminación pedido ${String(order.dailyOrderNumber).padStart(3, "0")}`,
              },
            });
          }
        }
      }

      await tx.order.delete({
        where: { id: order.id },
      });
    });

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    console.error("DELETE /api/admin/orders/[id] error:", error);

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "No se pudo eliminar el pedido",
      },
      { status: 400 }
    );
  }
}