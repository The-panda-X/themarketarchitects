import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import type { ApiResponse } from '@/types';

/** Roles that can access the admin panel */
const ADMIN_ROLES = ['HEAD_ADMIN', 'ADMIN', 'MODERATOR'];

/** Roles that can perform destructive actions (delete) */
const DELETE_ROLES = ['HEAD_ADMIN'];

/** Roles that can access sensitive data (credentials, payments) */
const SENSITIVE_ROLES = ['HEAD_ADMIN', 'ADMIN'];

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json<ApiResponse<T>>({ data }, { status });
}

export function errorResponse(error: string, status = 400, code?: string) {
  return NextResponse.json<ApiResponse>({ error, code }, { status });
}

export async function getAuthSession() {
  return getServerSession(authOptions);
}

export async function requireAuth() {
  const session = await getAuthSession();
  if (!session?.user) {
    throw new AuthError('Unauthorized', 401);
  }
  return session;
}

/** Requires MODERATOR, ADMIN, or HEAD_ADMIN */
export async function requireModerator() {
  const session = await requireAuth();
  const role = (session.user as { role?: string }).role;
  if (!role || !ADMIN_ROLES.includes(role)) {
    throw new AuthError('Forbidden', 403);
  }
  return session;
}

/** Requires ADMIN or HEAD_ADMIN */
export async function requireAdmin() {
  const session = await requireAuth();
  const role = (session.user as { role?: string }).role;
  if (!role || !SENSITIVE_ROLES.includes(role)) {
    throw new AuthError('Forbidden', 403);
  }
  return session;
}

/** Requires HEAD_ADMIN only — for destructive operations */
export async function requireHeadAdmin() {
  const session = await requireAuth();
  const role = (session.user as { role?: string }).role;
  if (!role || !DELETE_ROLES.includes(role)) {
    throw new AuthError('Forbidden', 403);
  }
  return session;
}

/** Get the role string from a session */
export function getSessionRole(session: { user: { role?: string } }): string {
  return (session.user as { role?: string }).role ?? 'USER';
}

/** Check if role is at least admin level (ADMIN or HEAD_ADMIN) */
export function isAdminRole(role: string): boolean {
  return SENSITIVE_ROLES.includes(role);
}

/** Check if role is HEAD_ADMIN */
export function isHeadAdmin(role: string): boolean {
  return role === 'HEAD_ADMIN';
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function handleApiError(error: unknown) {
  if (error instanceof AuthError) {
    return errorResponse(error.message, error.status);
  }
  console.error('API Error:', error);
  return errorResponse('Internal server error', 500);
}

const ALLOWED_SORT_FIELDS = new Set([
  'createdAt', 'updatedAt', 'name', 'email', 'status', 'totalAmount', 'amount', 'title', 'publishedAt',
]);

export function parsePagination(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));
  const rawSort = searchParams.get('sort') ?? 'createdAt';
  const sort = ALLOWED_SORT_FIELDS.has(rawSort) ? rawSort : 'createdAt';
  const rawOrder = searchParams.get('order');
  const order: 'asc' | 'desc' = rawOrder === 'asc' ? 'asc' : 'desc';

  return { page, limit, sort, order, skip: (page - 1) * limit };
}
