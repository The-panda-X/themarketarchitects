export const dynamic = 'force-dynamic';
import { type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin, handleApiError, successResponse, errorResponse, parsePagination } from '@/lib/api-helpers';
import { blogPostSchema } from '@/lib/validations';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = req.nextUrl;
    const { page, limit, skip } = parsePagination(searchParams);

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.blogPost.count(),
    ]);

    return successResponse({ data: posts, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const adminSession = await requireAdmin();
    const body = await req.json();
    const parsed = blogPostSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.errors[0].message, 400);

    const { title, slug: rawSlug, excerpt, content, coverImage, author, tags, published } = parsed.data;
    const slug = rawSlug ?? title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const post = await prisma.blogPost.create({
      data: {
        title,
        slug,
        excerpt,
        content,
        coverImage: coverImage ?? null,
        author: author ?? adminSession.user.name ?? 'Admin',
        tags: tags ?? [],
        published: published ?? false,
        publishedAt: published ? new Date() : null,
      },
    });

    return successResponse(post, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
