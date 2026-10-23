import "server-only";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const SIGNED_URL_TTL = 60 * 60 * 6; // 6 hours

export function isB2Configured(): boolean {
  const keyId = process.env.B2_KEY_ID || process.env.B2_APPLICATION_KEY_ID;
  const appKey = process.env.B2_APPLICATION_KEY;
  const bucket = process.env.B2_BUCKET_NAME;
  return Boolean(keyId && appKey && bucket);
}

export function getB2Client(): S3Client | null {
  const keyId = process.env.B2_KEY_ID || process.env.B2_APPLICATION_KEY_ID;
  const appKey = process.env.B2_APPLICATION_KEY;

  if (!keyId || !appKey) {
    return null;
  }

  // Parse endpoint & region (e.g., https://s3.us-east-005.backblazeb2.com)
  const endpoint =
    process.env.B2_ENDPOINT ||
    (process.env.B2_REGION
      ? `https://s3.${process.env.B2_REGION}.backblazeb2.com`
      : "https://s3.us-east-005.backblazeb2.com");

  const regionMatch = endpoint.match(/s3\.([a-z0-9-]+)\.backblazeb2\.com/i);
  const region = process.env.B2_REGION || (regionMatch ? regionMatch[1] : "us-east-005");

  return new S3Client({
    region,
    endpoint,
    credentials: {
      accessKeyId: keyId,
      secretAccessKey: appKey,
    },
  });
}

/**
 * Upload a file to Backblaze B2.
 */
export async function uploadToB2(
  filePath: string,
  contentType: string,
  buffer: Buffer
): Promise<void> {
  const client = getB2Client();
  const bucket = process.env.B2_BUCKET_NAME;

  if (!client || !bucket) {
    throw new Error("Backblaze B2 is not configured");
  }

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: filePath,
      Body: buffer,
      ContentType: contentType,
    })
  );
}

/**
 * Delete a file from Backblaze B2.
 */
export async function deleteFromB2(filePath: string): Promise<void> {
  const client = getB2Client();
  const bucket = process.env.B2_BUCKET_NAME;

  if (!client || !bucket) return;

  try {
    await client.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: filePath,
      })
    );
  } catch (err) {
    console.error("Failed to delete file from Backblaze B2:", err);
  }
}

/**
 * Get public URL or presigned URL for a Backblaze B2 object.
 */
export async function getB2Url(filePath: string): Promise<string> {
  const publicBaseUrl = process.env.B2_PUBLIC_URL?.replace(/\/$/, "");
  if (publicBaseUrl) {
    return `${publicBaseUrl}/${filePath.replace(/^\/+/, "")}`;
  }

  const client = getB2Client();
  const bucket = process.env.B2_BUCKET_NAME;

  if (!client || !bucket) {
    return "";
  }

  try {
    return await getSignedUrl(
      client,
      new GetObjectCommand({
        Bucket: bucket,
        Key: filePath,
      }),
      { expiresIn: SIGNED_URL_TTL }
    );
  } catch (err) {
    console.error("Failed to generate presigned URL from Backblaze B2:", err);
    return "";
  }
}
