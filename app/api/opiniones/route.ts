import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const reviews = await prisma.review.findMany({
      where: {
        isActive: true,
      },
      orderBy: [
        { sortOrder: "asc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json(reviews);
  } catch (error) {
    return NextResponse.json(
      { error: "No se pudieron obtener las opiniones", detail: String(error) },
      { status: 500 }
    );
  }
}