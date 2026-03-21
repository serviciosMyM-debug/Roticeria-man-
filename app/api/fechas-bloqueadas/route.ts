import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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