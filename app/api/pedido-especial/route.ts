import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const specialOrderSchema = z.object({
  customerName: z.string().min(2),
  phone: z.string().min(6),
  requestedDate: z.string().min(8),
  requestedTime: z.string().optional().nullable(),
  orderType: z.string().min(2),
  peopleCount: z.coerce.number().int().min(1).optional().nullable(),
  details: z.string().min(5),
});

function sameDayRange(dateString: string) {
  const base = new Date(dateString);
  const start = new Date(base);
  start.setHours(0, 0, 0, 0);

  const end = new Date(base);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = specialOrderSchema.parse(body);

    const { start, end } = sameDayRange(parsed.requestedDate);

    const blocked = await prisma.blockedDate.findMany({
      where: {
        date: {
          gte: start,
          lte: end,
        },
      },
    });

    const requestedTime = parsed.requestedTime || null;

    const isBlocked = blocked.some((item) => {
      if (item.isFullDay) return true;
      if (!requestedTime || !item.startTime || !item.endTime) return false;
      return requestedTime >= item.startTime && requestedTime <= item.endTime;
    });

    if (isBlocked) {
      return NextResponse.json(
        { error: "La fecha u horario seleccionado no está disponible." },
        { status: 400 }
      );
    }

    const specialOrder = await prisma.specialOrder.create({
      data: {
        customerName: parsed.customerName,
        phone: parsed.phone,
        requestedDate: new Date(parsed.requestedDate),
        requestedTime,
        orderType: parsed.orderType,
        peopleCount: parsed.peopleCount ?? null,
        details: parsed.details,
      },
    });

    return NextResponse.json({ ok: true, specialOrder });
  } catch (error) {
    return NextResponse.json(
      { error: "No se pudo crear el pedido especial", detail: String(error) },
      { status: 400 }
    );
  }
}