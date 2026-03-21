import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function isNowBetween(start: string, end: string) {
  const now = new Date();
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = sh * 60 + sm;
  const endMinutes = eh * 60 + em;

  return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
}

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
        isActive: true,
      },
      include: {
        items: {
          where: { available: true },
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    if (!menu) {
      return NextResponse.json({
        available: false,
        reason: "No hay menú del día cargado",
      });
    }

    const inTime = isNowBetween(menu.startsAt, menu.endsAt);

    if (!inTime) {
      return NextResponse.json({
        available: false,
        reason: "Fuera del horario del menú",
        startsAt: menu.startsAt,
        endsAt: menu.endsAt,
      });
    }

    return NextResponse.json({
      available: true,
      menu,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "No se pudo obtener el menú activo", detail: String(error) },
      { status: 500 }
    );
  }
}