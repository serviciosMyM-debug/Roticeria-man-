import { db } from "@/lib/db";
import { createSession, sessionCookieName } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!email || !password) {
      return Response.json(
        { error: "Email y contraseña son obligatorios" },
        { status: 400 }
      );
    }

    const admin = await db.admin.findUnique({
      where: { email },
    });

    if (!admin) {
      return Response.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    const ok = await bcrypt.compare(password, admin.passwordHash);

    if (!ok) {
      return Response.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    const token = await createSession({
      email: admin.email,
      name: admin.name ?? "Administrador",
    });

    cookies().set(sessionCookieName, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });

    return Response.json({
      ok: true,
      admin: {
        email: admin.email,
        name: admin.name ?? "Administrador",
      },
    });
  } catch (error) {
    return Response.json(
      {
        error: "No se pudo iniciar sesión",
        detail: String(error),
      },
      { status: 500 }
    );
  }
}