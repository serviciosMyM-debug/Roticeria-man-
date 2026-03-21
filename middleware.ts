import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const key = new TextEncoder().encode(process.env.SESSION_SECRET || 'change-me-session-secret');

export async function middleware(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith('/admin') || request.nextUrl.pathname === '/admin/login') {
    return NextResponse.next();
  }

  const token = request.cookies.get('gastro_admin_session')?.value;
  if (!token) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  try {
    await jwtVerify(token, key);
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }
}

export const config = {
  matcher: ['/admin/:path*']
};
