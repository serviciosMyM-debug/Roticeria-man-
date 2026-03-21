import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const key = new TextEncoder().encode(process.env.SESSION_SECRET || 'change-me-session-secret');
export const sessionCookieName = 'gastro_admin_session';

export async function createSession(payload: { email: string; name: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(key);
}

export async function verifySession(token: string) {
  const { payload } = await jwtVerify(token, key);
  return payload as { email: string; name: string };
}

export async function getSession() {
  const token = cookies().get(sessionCookieName)?.value;
  if (!token) return null;
  try {
    return await verifySession(token);
  } catch {
    return null;
  }
}
