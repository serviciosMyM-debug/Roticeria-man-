import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeString(value: unknown, fallback = "") {
  if (typeof value === "string") return value.trim();
  return fallback;
}

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

    return NextResponse.json({
      ok: true,
      settings,
    });
  } catch (error) {
    console.error("GET /api/admin/settings error:", error);

    return NextResponse.json(
      {
        ok: false,
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

    const payload = {
      businessName: normalizeString(body.businessName, "Mana"),
      heroTitle: normalizeString(body.heroTitle, "Comida rica, rápida y casera"),
      heroSubtitle: normalizeString(
        body.heroSubtitle,
        "Menú del día, viandas y rotisería lista para pedir"
      ),
      whatsappNumber: normalizeString(body.whatsappNumber, "5493416100044"),
      description: normalizeString(
        body.description,
        "Comida casera, rápida y lista para llevar."
      ),
      address: normalizeString(body.address, "Av. Principal 123"),
      openingHours: normalizeString(
        body.openingHours,
        "Lunes a Sábado de 10:00 a 15:00 y 19:00 a 23:30"
      ),
      instagramUrl: normalizeString(body.instagramUrl) || null,
      facebookUrl: normalizeString(body.facebookUrl) || null,
      logoUrl: normalizeString(body.logoUrl) || null,
      primaryColor: normalizeString(body.primaryColor, "#d97706"),
      secondaryColor: normalizeString(body.secondaryColor, "#111111"),
    };

    let settings = await prisma.settings.findFirst();

    if (!settings) {
      settings = await prisma.settings.create({
        data: payload,
      });
    } else {
      settings = await prisma.settings.update({
        where: { id: settings.id },
        data: payload,
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
        ok: false,
        error: "No se pudo guardar la configuración",
        detail: String(error),
      },
      { status: 500 }
    );
  }
}