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
  instagramUrl: z.string().nullable().optional(),
  facebookUrl: z.string().nullable().optional(),
  logoUrl: z.string().nullable().optional(),
  primaryColor: z.string().min(4),
  secondaryColor: z.string().min(4),
});

export async function GET() {
  try {
    let settings = await prisma.settings.findFirst();

    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          businessName: "Mana",
          heroTitle: "Comida rica, rápida y casera",
          heroSubtitle: "Menú del día, viandas y rotisería lista para pedir",
          whatsappNumber: "5493416100044",
          description: "Comida casera, rápida y lista para llevar.",
          address: "Av. Principal 123",
          openingHours: "Lunes a Sábado de 10:00 a 15:00 y 19:00 a 23:30",
          instagramUrl: null,
          facebookUrl: null,
          logoUrl: null,
          primaryColor: "#d97706",
          secondaryColor: "#111111",
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("GET /api/admin/settings error:", error);

    return NextResponse.json(
      {
        error: "No se pudo obtener la configuración",
        detail: String(error),
      },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = settingsSchema.parse({
      ...body,
      instagramUrl: body.instagramUrl || null,
      facebookUrl: body.facebookUrl || null,
      logoUrl: body.logoUrl || null,
    });

    let settings = await prisma.settings.findFirst();

    if (!settings) {
      settings = await prisma.settings.create({
        data: parsed,
      });
    } else {
      settings = await prisma.settings.update({
        where: { id: settings.id },
        data: parsed,
      });
    }

    return NextResponse.json({
      ok: true,
      settings,
    });
  } catch (error) {
    console.error("PUT /api/admin/settings error:", error);

    return NextResponse.json(
      {
        error: "No se pudo guardar la configuración",
        detail: String(error),
      },
      { status: 400 }
    );
  }
}