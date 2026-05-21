export const dynamic = 'force-dynamic';

import { type NextRequest } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { requireAdmin, handleApiError, successResponse, errorResponse } from '@/lib/api-helpers';

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) return errorResponse('No file provided.', 400);
    if (!ALLOWED_TYPES.includes(file.type)) {
      return errorResponse('Only JPEG, PNG, WebP, and GIF images are allowed.', 400);
    }
    if (file.size > MAX_SIZE) {
      return errorResponse('Image must be under 5 MB.', 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Unique filename: timestamp + random suffix + original extension
    const ext   = (file.name.split('.').pop() ?? 'jpg').toLowerCase();
    const name  = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'blog');
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, name), buffer);

    return successResponse({ url: `/uploads/blog/${name}` }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
