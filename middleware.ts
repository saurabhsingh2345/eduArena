import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth.config';
import { NextResponse } from 'next/server';

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const role = (req.auth?.user as { role?: string } | undefined)?.role;
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/admin')) {
    if (!isLoggedIn || role !== 'admin') {
      const url = new URL('/login', req.url);
      url.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  const isProtected = ['/dashboard', '/course', '/learn', '/leaderboard'].some(
    (p) => pathname.startsWith(p)
  );
  if (isProtected && !isLoggedIn) {
    const url = new URL('/login', req.url);
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }
});

export const config = {
  matcher: [
    '/admin/:path*',
    '/dashboard/:path*',
    '/course/:path*',
    '/learn/:path*',
    '/leaderboard/:path*',
  ],
};
