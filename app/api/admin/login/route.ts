import { db } from '@/lib/db';
import { createSession, sessionCookieName } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  const body = await request.json();
  const email = String(body.email || '');
  const password = String(body.password || '');

  const admin = await db.admin.findUnique({ where: { email } });
  if (!admin) return Response.json({ error: 'Credenciales inválidas' }, { status: 401 });

  const ok = await bcrypt.compare(password, admin.passwordHash);
  if (!ok) return Response.json({ error: 'Credenciales inválidas' }, { status: 401 });

  const token = await createSession({ email: admin.email, name: admin.name });
  cookies().set(sessionCookieName, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7
  });

  return Response.json({ ok: true });
}
