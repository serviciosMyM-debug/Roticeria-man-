import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(2),
  shortDescription: z.string().min(2),
  description: z.string().min(2),
  price: z.coerce.number().min(0),
  promoPrice: z.coerce.number().min(0).nullable().optional(),
  promoStartsAt: z.string().nullable().optional(),
  promoEndsAt: z.string().nullable().optional(),
  stock: z.coerce.number().int().min(0),
  lowStockAlert: z.coerce.number().int().min(0).default(5),
  imageUrl: z.string().nullable().optional(),
  categoryId: z.string().min(1),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
  isPromo: z.boolean(),
  isDailyMenu: z.boolean(),
});

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(_: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    return NextResponse.json(
      { error: "No se pudo obtener el producto", detail: String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = updateSchema.parse(body);

    const existing = await prisma.product.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }

    const stockDiff = parsed.stock - existing.stock;

    const updated = await prisma.product.update({
      where: { id },
      data: {
        name: parsed.name,
        shortDescription: parsed.shortDescription,
        description: parsed.description,
        price: parsed.price,
        promoPrice: parsed.promoPrice ?? null,
        promoStartsAt: parsed.promoStartsAt ? new Date(parsed.promoStartsAt) : null,
        promoEndsAt: parsed.promoEndsAt ? new Date(parsed.promoEndsAt) : null,
        stock: parsed.stock,
        lowStockAlert: parsed.lowStockAlert,
        imageUrl: parsed.imageUrl ?? null,
        categoryId: parsed.categoryId,
        isActive: parsed.isActive,
        isFeatured: parsed.isFeatured,
        isPromo: parsed.isPromo,
        isDailyMenu: parsed.isDailyMenu,
      },
      include: { category: true },
    });

    if (stockDiff !== 0) {
      await prisma.stockMovement.create({
        data: {
          productId: id,
          type: stockDiff > 0 ? "MANUAL_INCREASE" : "MANUAL_DECREASE",
          quantity: stockDiff,
          note: "Ajuste manual desde admin",
        },
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: "No se pudo actualizar el producto", detail: String(error) },
      { status: 400 }
    );
  }
}

export async function DELETE(_: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    const existing = await prisma.product.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }

    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: "No se pudo eliminar el producto", detail: String(error) },
      { status: 400 }
    );
  }
}