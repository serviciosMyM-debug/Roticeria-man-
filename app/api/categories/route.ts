import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json(categories);
  } catch (error) {
    return NextResponse.json(
      { error: "No se pudieron obtener las categorías", detail: String(error) },
      { status: 500 }
    );
  }
}