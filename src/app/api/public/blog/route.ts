import { type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, handleApiError } from '@/lib/api-helpers';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const slug = searchParams.get('slug');

    if (slug) {
      const post = await prisma.blogPost.findFirst({
        where: { slug, published: true },
      });
      return successResponse(post);
    }

    const posts = await prisma.blogPost.findMany({
      where: { published: true },
      orderBy: { publishedAt: 'desc' },
      take: 20,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        coverImage: true,
        author: true,
        tags: true,
        publishedAt: true,
      },
    });

    return successResponse(posts);
  } catch (err) {
    return handleApiError(err);
  }
}
