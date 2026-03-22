import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

const productSchema = z.object({
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

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("GET /api/admin/productos error:", error);

    return NextResponse.json(
      {
        error: "No se pudieron obtener los productos",
        detail: String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = productSchema.parse(body);

    const slugBase = slugify(parsed.name);
    let slug = slugBase;
    let i = 1;

    while (await prisma.product.findUnique({ where: { slug } })) {
      slug = `${slugBase}-${i++}`;
    }

    const product = await prisma.product.create({
      data: {
        name: parsed.name,
        slug,
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
      include: {
        category: true,
      },
    });

    await prisma.stockMovement.create({
      data: {
        productId: product.id,
        type: "INITIAL_LOAD",
        quantity: parsed.stock,
        note: "Carga inicial desde admin",
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/productos error:", error);

    return NextResponse.json(
      {
        error: "No se pudo crear el producto",
        detail: String(error),
      },
      { status: 400 }
    );
  }
}