const S3_BUCKET = process.env.S3_BUCKET_NAME ?? '';
const S3_REGION = process.env.S3_REGION ?? 'us-east-1';
const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY_ID ?? '';
const S3_SECRET_KEY = process.env.S3_SECRET_ACCESS_KEY ?? '';

interface UploadResult {
  url: string;
  key: string;
}

export async function uploadToS3(
  file: ArrayBuffer,
  filename: string,
  contentType: string
): Promise<UploadResult> {
  if (!S3_BUCKET || !S3_ACCESS_KEY || !S3_SECRET_KEY) {
    throw new Error('S3 credentials are not configured');
  }

  const key = `uploads/${Date.now()}-${filename}`;
  const endpoint = `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${key}`;

  const response = await fetch(endpoint, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
      'x-amz-acl': 'public-read',
    },
    body: file,
  });

  if (!response.ok) {
    throw new Error(`S3 upload failed: ${response.statusText}`);
  }

  return { url: endpoint, key };
}

export function getS3Url(key: string): string {
  return `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${key}`;
}

export async function deleteFromS3(key: string): Promise<void> {
  if (!S3_BUCKET) return;

  const endpoint = `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${key}`;

  await fetch(endpoint, { method: 'DELETE' });
}
