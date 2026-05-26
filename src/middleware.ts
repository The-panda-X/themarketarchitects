import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

const ADMIN_ROLES = ['HEAD_ADMIN', 'ADMIN', 'MODERATOR'];

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    if (pathname.startsWith('/admin') && !ADMIN_ROLES.includes(token?.role as string)) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) {
          return !!token;
        }

        return true;
      },
    },
  }
);

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
};
