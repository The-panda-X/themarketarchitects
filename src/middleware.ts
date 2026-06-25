import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

const ADMIN_ROLES = ['HEAD_ADMIN', 'ADMIN', 'MODERATOR', 'TRADER'];

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    const role = token?.role as string;

    if (pathname.startsWith('/admin') && !ADMIN_ROLES.includes(role)) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // TRADER can only access /admin/signals — redirect everything else
    if (role === 'TRADER' && pathname.startsWith('/admin') && !pathname.startsWith('/admin/signals')) {
      return NextResponse.redirect(new URL('/admin/signals', req.url));
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
