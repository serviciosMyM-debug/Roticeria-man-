import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  status: z.enum(["PENDING", "REVIEWED", "APPROVED", "REJECTED", "COMPLETED"]),
  adminNotes: z.string().nullable().optional(),
});

type Params = {
  params: Promise<{ id: string }>;
};

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = updateSchema.parse(body);

    const updated = await prisma.specialOrder.update({
      where: { id },
      data: {
        status: parsed.status,
        adminNotes: parsed.adminNotes ?? null,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: "No se pudo actualizar el pedido especial", detail: String(error) },
      { status: 400 }
    );
  }
}