import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import type { ApiResponse } from '@/types';

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

export async function requireAdmin() {
  const session = await requireAuth();
  if ((session.user as { role?: string }).role !== 'ADMIN') {
    throw new AuthError('Forbidden', 403);
  }
  return session;
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
