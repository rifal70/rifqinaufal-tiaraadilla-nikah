import "server-only";
import { query } from "@/lib/neon/db";

/**
 * Save or update a media file directly in Neon Postgres.
 */
export async function saveMediaFile(filePath: string, contentType: string, buffer: Buffer): Promise<void> {
  await query(
    `INSERT INTO media_files (file_path, content_type, data)
     VALUES ($1, $2, $3)
     ON CONFLICT (file_path)
     DO UPDATE SET content_type = EXCLUDED.content_type, data = EXCLUDED.data`,
    [filePath, contentType, buffer]
  );
}

/**
 * Delete a media file from Neon Postgres.
 */
export async function deleteMediaFile(filePath: string): Promise<void> {
  await query("DELETE FROM media_files WHERE file_path = $1", [filePath]);
}
