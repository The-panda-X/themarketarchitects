export const dynamic = 'force-dynamic';
import { type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireModerator, handleApiError, successResponse, parsePagination, getSessionRole, isHeadAdmin } from '@/lib/api-helpers';

const ROLE_ORDER: Record<string, number> = { HEAD_ADMIN: 0, ADMIN: 1, MODERATOR: 2, TRADER: 3, USER: 4 };

export async function GET(req: NextRequest) {
  try {
    const session = await requireModerator();
    const viewerRole = getSessionRole(session as { user: { role?: string } });
    const viewerIsHeadAdmin = isHeadAdmin(viewerRole);

    const { searchParams } = req.nextUrl;
    const { page, limit, skip } = parsePagination(searchParams);
    const search = searchParams.get('search') ?? '';
    const role = searchParams.get('role') ?? '';

    const roleFilter: Record<string, unknown> = {};
    if (role) {
      roleFilter.role = role;
    } else if (!viewerIsHeadAdmin) {
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

    // Sort staff roles to the top: HEAD_ADMIN > ADMIN > MODERATOR > TRADER > USER
    const sorted = [...users].sort((a, b) => {
      const ra = ROLE_ORDER[a.role] ?? 4;
      const rb = ROLE_ORDER[b.role] ?? 4;
      if (ra !== rb) return ra - rb;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return successResponse({ data: sorted, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    return handleApiError(err);
  }
}
