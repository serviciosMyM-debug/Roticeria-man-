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

type Params = {
  params: Promise<{ id: string }>;
};

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = reviewSchema.parse(body);

    const review = await prisma.review.update({
      where: { id },
      data: {
        name: parsed.name,
        content: parsed.content,
        rating: parsed.rating,
        isActive: parsed.isActive,
        sortOrder: parsed.sortOrder,
      },
    });

    return NextResponse.json(review);
  } catch (error) {
    return NextResponse.json(
      { error: "No se pudo actualizar la opinión", detail: String(error) },
      { status: 400 }
    );
  }
}

export async function DELETE(_: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    await prisma.review.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: "No se pudo eliminar la opinión", detail: String(error) },
      { status: 400 }
    );
  }
}