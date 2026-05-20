import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const S3_BUCKET = process.env.S3_BUCKET_NAME ?? '';
const S3_REGION = process.env.S3_REGION ?? 'us-east-1';

function getS3Client() {
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;

  if (!accessKeyId || !secretAccessKey || !S3_BUCKET) {
    throw new Error('S3 credentials are not configured');
  }

  return new S3Client({
    region: S3_REGION,
    credentials: { accessKeyId, secretAccessKey },
  });
}

interface UploadResult {
  url: string;
  key: string;
}

export async function uploadToS3(
  file: ArrayBuffer,
  filename: string,
  contentType: string
): Promise<UploadResult> {
  const client = getS3Client();
  const key = `uploads/${Date.now()}-${filename}`;

  await client.send(
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: Buffer.from(file),
      ContentType: contentType,
    })
  );

  return { url: getS3Url(key), key };
}

export function getS3Url(key: string): string {
  return `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${key}`;
}

export async function deleteFromS3(key: string): Promise<void> {
  if (!S3_BUCKET) return;

  const client = getS3Client();
  await client.send(
    new DeleteObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    })
  );
}
