import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { manaBulkProducts } from "@/lib/mana-menu-bulk";

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export async function POST() {
  try {
    for (const item of manaBulkProducts) {
      const categorySlug = slugify(item.category);

      let category = await prisma.category.findUnique({
        where: { slug: categorySlug },
      });

      if (!category) {
        category = await prisma.category.create({
          data: {
            name: item.category,
            slug: categorySlug,
          },
        });
      }

      const productSlug = slugify(item.name);

      const existing = await prisma.product.findUnique({
        where: { slug: productSlug },
      });

      if (existing) continue;

      const created = await prisma.product.create({
        data: {
          name: item.name,
          slug: productSlug,
          shortDescription: item.name,
          description: item.name,
          price: item.price,
          stock: item.stock,
          categoryId: category.id,
          isActive: true,
          isFeatured: false,
          isPromo: false,
          isDailyMenu: false,
        },
      });

      await prisma.stockMovement.create({
        data: {
          productId: created.id,
          type: "INITIAL_LOAD",
          quantity: item.stock,
          note: "Carga masiva desde menú visual",
        },
      });
    }

    return NextResponse.json({
      ok: true,
      message: "Carga masiva completada.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "No se pudo completar la carga masiva",
        detail: String(error),
      },
      { status: 500 }
    );
  }
}