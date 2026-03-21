import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const settingsSchema = z.object({
  businessName: z.string().min(2),
  heroTitle: z.string().min(2),
  heroSubtitle: z.string().min(2),
  whatsappNumber: z.string().min(8),
  description: z.string().min(2),
  address: z.string().min(2),
  openingHours: z.string().min(2),
  instagramUrl: z.string().optional().nullable(),
  facebookUrl: z.string().optional().nullable(),
  logoUrl: z.string().optional().nullable(),
  primaryColor: z.string().min(4),
  secondaryColor: z.string().min(4),
});

export async function GET() {
  try {
    let settings = await prisma.settings.findFirst();

    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          businessName: "Mi Rotisería",
          heroTitle: "Comida rica y casera",
          heroSubtitle: "Menú del día, viandas y promos",
          whatsappNumber: "5490000000000",
          description: "Rotisería moderna",
          address: "Dirección",
          openingHours: "Horarios",
          primaryColor: "#d97706",
          secondaryColor: "#111111",
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json(
      { error: "No se pudo obtener la configuración", detail: String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = settingsSchema.parse(body);

    let settings = await prisma.settings.findFirst();

    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          ...parsed,
          instagramUrl: parsed.instagramUrl || null,
          facebookUrl: parsed.facebookUrl || null,
          logoUrl: parsed.logoUrl || null,
        },
      });
    } else {
      settings = await prisma.settings.update({
        where: { id: settings.id },
        data: {
          ...parsed,
          instagramUrl: parsed.instagramUrl || null,
          facebookUrl: parsed.facebookUrl || null,
          logoUrl: parsed.logoUrl || null,
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json(
      { error: "No se pudo guardar la configuración", detail: String(error) },
      { status: 400 }
    );
  }
}
