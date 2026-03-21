import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const specialOrders = await prisma.specialOrder.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(specialOrders);
  } catch (error) {
    return NextResponse.json(
      { error: "No se pudieron obtener los pedidos especiales", detail: String(error) },
      { status: 500 }
    );
  }
}