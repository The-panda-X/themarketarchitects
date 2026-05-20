export const dynamic = 'force-dynamic';
import { type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin, handleApiError, successResponse, errorResponse } from '@/lib/api-helpers';
import { blogPostSchema } from '@/lib/validations';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    const post = await prisma.blogPost.findUnique({ where: { id: params.id } });
    if (!post) return errorResponse('Post not found', 404);
    return successResponse(post);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    const body = await req.json();

    const existing = await prisma.blogPost.findUnique({ where: { id: params.id } });
    if (!existing) return errorResponse('Post not found', 404);

    const partialSchema = blogPostSchema.partial();
    const parsed = partialSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message, 400);
    }

    const updateData: Record<string, unknown> = { ...parsed.data };
    if (parsed.data.published && !existing.published) {
      updateData.publishedAt = new Date();
    }

    const post = await prisma.blogPost.update({ where: { id: params.id }, data: updateData });
    return successResponse(post);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    await prisma.blogPost.delete({ where: { id: params.id } });
    return successResponse({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}
