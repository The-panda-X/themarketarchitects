export const dynamic = 'force-dynamic';
import { type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireModerator, handleApiError, successResponse, parsePagination, getSessionRole, isHeadAdmin } from '@/lib/api-helpers';

export async function GET(req: NextRequest) {
  try {
    const session = await requireModerator();
    const viewerRole = getSessionRole(session as { user: { role?: string } });
    const viewerIsHeadAdmin = isHeadAdmin(viewerRole);

    const { searchParams } = req.nextUrl;
    const { page, limit, skip } = parsePagination(searchParams);
    const search = searchParams.get('search') ?? '';
    const role = searchParams.get('role') ?? '';

    // Build the where clause — cast role filters to `any` since Prisma types
    // may not yet include HEAD_ADMIN/MODERATOR until after `prisma db push`
    const roleFilter: Record<string, unknown> = {};
    if (role) {
      roleFilter.role = role;
    } else if (!viewerIsHeadAdmin) {
      // Hide HEAD_ADMIN users from non-HEAD_ADMIN viewers
      roleFilter.role = { not: 'HEAD_ADMIN' };
    }

    const where: Record<string, unknown> = {
      ...(search && {
        OR: [
          { email: { contains: search, mode: 'insensitive' as const } },
          { name: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
      ...roleFilter,
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
          role: true,
          emailVerified: true,
          referralCode: true,
          lastLoginCountry: true,
          lastLoginCity: true,
          lastLoginRegion: true,
          lastLoginAt: true,
          ...(viewerIsHeadAdmin && {
            lastLoginIp: true,
            lastLoginLat: true,
            lastLoginLon: true,
          }),
          createdAt: true,
          _count: { select: { orders: true, challenges: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return successResponse({ data: users, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    return handleApiError(err);
  }
}
