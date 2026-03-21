import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const reviewSchema = z.object({
  name: z.string().min(2),
  content: z.string().min(5),
  rating: z.coerce.number().int().min(1).max(5),
  isActive: z.boolean(),
  sortOrder: z.coerce.number().int().min(0),
});

export async function GET() {
  try {
    const reviews = await prisma.review.findMany({
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = reviewSchema.parse(body);

    const review = await prisma.review.create({
      data: {
        name: parsed.name,
        content: parsed.content,
        rating: parsed.rating,
        isActive: parsed.isActive,
        sortOrder: parsed.sortOrder,
      },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "No se pudo crear la opinión", detail: String(error) },
      { status: 400 }
    );
  }
}