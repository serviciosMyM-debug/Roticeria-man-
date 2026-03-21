import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        customer: true,
        items: true,
        sale: true,
      },
    });

    return NextResponse.json({
      ok: true,
      orders,
    });
  } catch (error) {
    console.error("GET /api/admin/orders error:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "No se pudieron obtener los pedidos",
        detail: String(error),
      },
      { status: 500 }
    );
  }
}