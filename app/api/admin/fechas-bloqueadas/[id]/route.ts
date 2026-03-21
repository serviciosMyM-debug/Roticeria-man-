import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    await prisma.blockedDate.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: "No se pudo eliminar la fecha bloqueada", detail: String(error) },
      { status: 400 }
    );
  }
}