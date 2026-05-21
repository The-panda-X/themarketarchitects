export const dynamic = 'force-dynamic';

import { requireAdmin, handleApiError, successResponse } from '@/lib/api-helpers';
import prisma from '@/lib/prisma';

// Default built-in categories always present as suggestions
const DEFAULT_CATEGORIES = ['Prop Firm Guide', 'Trading Tips'];

export async function GET() {
  try {
    await requireAdmin();

    // Fetch first tag of every post (that has at least one tag)
    const posts = await prisma.blogPost.findMany({
      select: { tags: true },
      where: { tags: { isEmpty: false } },
    });

    const fromDb = posts
      .map((p) => p.tags[0])
      .filter(Boolean) as string[];

    // Merge defaults + DB values, deduplicate, preserve order
    const merged = [...new Set([...DEFAULT_CATEGORIES, ...fromDb])];

    return successResponse(merged);
  } catch (err) {
    return handleApiError(err);
  }
}
