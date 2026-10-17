import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { referralSlug: slug.toLowerCase() },
        { referralCode: slug },
      ],
    },
    select: { referralCode: true },
  });

  if (!user) {
    return NextResponse.redirect(new URL('/register', _request.url));
  }

  return NextResponse.redirect(
    new URL(`/register?ref=${encodeURIComponent(user.referralCode)}`, _request.url)
  );
}
