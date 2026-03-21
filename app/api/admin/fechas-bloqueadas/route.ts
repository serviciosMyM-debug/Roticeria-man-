import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const blockedDateSchema = z.object({
  date: z.string().min(8),
  isFullDay: z.boolean(),
  startTime: z.string().nullable().optional(),
  endTime: z.string().nullable().optional(),
  reason: z.string().nullable().optional(),
});

export async function GET() {
  try {
    const blockedDates = await prisma.blockedDate.findMany({
      orderBy: {
        date: "asc",
      },
    });

    return NextResponse.json(blockedDates);
  } catch (error) {
    return NextResponse.json(
      { error: "No se pudieron obtener las fechas bloqueadas", detail: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = blockedDateSchema.parse(body);

    const blockedDate = await prisma.blockedDate.create({
      data: {
        date: new Date(parsed.date),
        isFullDay: parsed.isFullDay,
        startTime: parsed.isFullDay ? null : parsed.startTime ?? null,
        endTime: parsed.isFullDay ? null : parsed.endTime ?? null,
        reason: parsed.reason ?? null,
      },
    });

    return NextResponse.json(blockedDate, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "No se pudo crear la fecha bloqueada", detail: String(error) },
      { status: 400 }
    );
  }
}