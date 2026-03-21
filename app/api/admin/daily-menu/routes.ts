import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { z } from "zod";

const itemSchema = z.object({
  id: z.string().optional(),
  productId: z.string().nullable().optional(),
  name: z.string().min(2),
  description: z.string().min(2),
  price: z.coerce.number().min(0),
  imageUrl: z.string().nullable().optional(),
  available: z.boolean(),
  isPopular: z.boolean(),
  sortOrder: z.coerce.number().int().min(0),
});

const menuSchema = z.object({
  title: z.string().min(2),
  startsAt: z.string().min(4),
  endsAt: z.string().min(4),
  isActive: z.boolean(),
  items: z.array(itemSchema).length(2),
});

function getTodayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

export async function GET() {
  try {
    const { start, end } = getTodayRange();

    const menu = await prisma.dailyMenu.findFirst({
      where: {
        date: {
          gte: start,
          lte: end,
        },
      },
      include: {
        items: {
          orderBy: {
            sortOrder: "asc",
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    const products = await prisma.product.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
        price: true,
        imageUrl: true,
      },
    });

    return NextResponse.json({ menu, products });
  } catch (error) {
    return NextResponse.json(
      { error: "No se pudo obtener el menú del día", detail: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = menuSchema.parse(body);

    const { start, end } = getTodayRange();

    const existing = await prisma.dailyMenu.findFirst({
      where: {
        date: {
          gte: start,
          lte: end,
        },
      },
      include: {
        items: true,
      },
    });

    let menu;

    if (!existing) {
      menu = await prisma.dailyMenu.create({
        data: {
          date: start,
          title: parsed.title,
          startsAt: parsed.startsAt,
          endsAt: parsed.endsAt,
          isActive: parsed.isActive,
        },
      });
    } else {
      menu = await prisma.dailyMenu.update({
        where: { id: existing.id },
        data: {
          title: parsed.title,
          startsAt: parsed.startsAt,
          endsAt: parsed.endsAt,
          isActive: parsed.isActive,
        },
      });

      await prisma.dailyMenuItem.deleteMany({
        where: {
          dailyMenuId: menu.id,
        },
      });
    }

    await prisma.dailyMenuItem.createMany({
      data: parsed.items.map((item) => ({
        dailyMenuId: menu.id,
        productId: item.productId || null,
        name: item.name,
        description: item.description,
        price: new Prisma.Decimal(item.price),
        imageUrl: item.imageUrl || null,
        available: item.available,
        isPopular: item.isPopular,
        sortOrder: item.sortOrder,
      })),
    });

    const updated = await prisma.dailyMenu.findUnique({
      where: { id: menu.id },
      include: {
        items: {
          orderBy: {
            sortOrder: "asc",
          },
        },
      },
    });

    return NextResponse.json({ ok: true, menu: updated });
  } catch (error) {
    return NextResponse.json(
      { error: "No se pudo guardar el menú del día", detail: String(error) },
      { status: 400 }
    );
  }
}