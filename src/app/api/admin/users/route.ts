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
      prisma.$queryRaw`
        SELECT u.id, u.email, u.name, u.avatar, u.role,
               u."emailVerified", u."referralCode",
               u."lastLoginCountry", u."lastLoginCity", u."lastLoginRegion",
               u."lastLoginAt",
               ${viewerIsHeadAdmin} AS "showSensitive",
               u."lastLoginIp", u."lastLoginLat", u."lastLoginLon",
               u."createdAt",
               (SELECT COUNT(*)::int FROM "Order" WHERE "userId" = u.id) AS "orderCount",
               (SELECT COUNT(*)::int FROM "Challenge" WHERE "userId" = u.id) AS "challengeCount"
        FROM "User" u
        WHERE (${!search} OR u.email ILIKE ${'%' + search + '%'} OR u.name ILIKE ${'%' + search + '%'})
          AND (${!role} OR u.role = ${role})
          AND (${viewerIsHeadAdmin} OR u.role != 'HEAD_ADMIN')
        ORDER BY
          CASE u.role
            WHEN 'HEAD_ADMIN' THEN 0
            WHEN 'ADMIN'      THEN 1
            WHEN 'MODERATOR'  THEN 2
            WHEN 'TRADER'     THEN 3
            ELSE 4
          END,
          u."createdAt" DESC
        LIMIT ${limit} OFFSET ${skip}
      ` as unknown as Array<Record<string, unknown>>,
      prisma.user.count({ where }),
    ]);

    // Reshape raw rows to match the expected frontend format
    const shaped = (users as Array<Record<string, unknown>>).map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      avatar: u.avatar,
      role: u.role,
      emailVerified: u.emailVerified,
      referralCode: u.referralCode,
      lastLoginCountry: u.lastLoginCountry,
      lastLoginCity: u.lastLoginCity,
      lastLoginRegion: u.lastLoginRegion,
      lastLoginAt: u.lastLoginAt,
      ...(viewerIsHeadAdmin && {
        lastLoginIp: u.lastLoginIp,
        lastLoginLat: u.lastLoginLat,
        lastLoginLon: u.lastLoginLon,
      }),
      createdAt: u.createdAt,
      _count: { orders: u.orderCount ?? 0, challenges: u.challengeCount ?? 0 },
    }));

    return successResponse({ data: shaped, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    return handleApiError(err);
  }
}
