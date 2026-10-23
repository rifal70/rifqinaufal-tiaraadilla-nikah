import "server-only";
import { query } from "@/lib/neon/db";
import { isB2Configured, uploadToB2, deleteFromB2, getB2Url } from "@/lib/b2";

/**
 * Save or update a media file in Backblaze B2 (or Neon Postgres fallback).
 */
export async function saveMediaFile(
  filePath: string,
  contentType: string,
  buffer: Buffer
): Promise<void> {
  if (isB2Configured()) {
    try {
      await uploadToB2(filePath, contentType, buffer);
      return;
    } catch (err) {
      console.error("Backblaze B2 upload error, falling back to database:", err);
    }
  }

  // Fallback to Neon Postgres media_files table
  await query(
    `INSERT INTO media_files (file_path, content_type, data)
     VALUES ($1, $2, $3)
     ON CONFLICT (file_path)
     DO UPDATE SET content_type = EXCLUDED.content_type, data = EXCLUDED.data`,
    [filePath, contentType, buffer]
  );
}

/**
 * Delete a media file from Backblaze B2 and Neon Postgres.
 */
export async function deleteMediaFile(filePath: string): Promise<void> {
  if (isB2Configured()) {
    await deleteFromB2(filePath);
  }
  await query("DELETE FROM media_files WHERE file_path = $1", [filePath]);
}

/**
 * Resolve accessible URL for media.
 */
export async function getMediaUrl(filePath?: string | null): Promise<string> {
  if (!filePath) return "";
  if (/^https?:\/\//.test(filePath) || filePath.startsWith("/")) {
    return filePath;
  }

  const cleanPath = filePath.replace(/^\/+/, "");
  if (isB2Configured()) {
    const b2Url = await getB2Url(cleanPath);
    if (b2Url) return b2Url;
  }

  return `/api/media/${cleanPath}`;
}
