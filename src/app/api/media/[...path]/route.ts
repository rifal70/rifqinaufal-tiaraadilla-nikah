import { NextRequest } from "next/server";
import { query } from "@/lib/neon/db";
import { isB2Configured, getB2Client } from "@/lib/b2";
import { GetObjectCommand } from "@aws-sdk/client-s3";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ path: string[] }> }
) {
  const { path } = await ctx.params;
  const filePath = path.join("/");

  if (!filePath || filePath.includes("..")) {
    return new Response("Not Found", { status: 404 });
  }

  try {
    let contentType = "application/octet-stream";
    let dataBuffer: Buffer | null = null;

    // 1. Try Backblaze B2 if configured
    if (isB2Configured()) {
      try {
        const client = getB2Client();
        const bucket = process.env.B2_BUCKET_NAME;
        if (client && bucket) {
          const obj = await client.send(
            new GetObjectCommand({ Bucket: bucket, Key: filePath })
          );
          if (obj.Body) {
            const bytes = await obj.Body.transformToByteArray();
            dataBuffer = Buffer.from(bytes);
            contentType = obj.ContentType || contentType;
          }
        }
      } catch (b2Err) {
        // Fall back to Neon if not in B2
      }
    }

    // 2. Fall back to Neon media_files table
    if (!dataBuffer) {
      const rows = await query<{ content_type: string; data: Buffer }>(
        "SELECT content_type, data FROM media_files WHERE file_path = $1 LIMIT 1",
        [filePath]
      );

      if (rows.length && rows[0].data) {
        contentType = rows[0].content_type || contentType;
        dataBuffer = Buffer.isBuffer(rows[0].data)
          ? rows[0].data
          : Buffer.from(rows[0].data as any);
      }
    }

    if (!dataBuffer) {
      return new Response("Not Found", { status: 404 });
    }

    // Support range header for audio seeking
    const range = request.headers.get("range");
    const totalSize = dataBuffer.length;

    if (range && range.startsWith("bytes=")) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;

      if (!isNaN(start) && !isNaN(end) && start <= end && end < totalSize) {
        const chunk = dataBuffer.subarray(start, end + 1);
        return new Response(new Uint8Array(chunk), {
          status: 206,
          headers: {
            "Content-Range": `bytes ${start}-${end}/${totalSize}`,
            "Accept-Ranges": "bytes",
            "Content-Length": String(chunk.length),
            "Content-Type": contentType,
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      }
    }

    return new Response(new Uint8Array(dataBuffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(totalSize),
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err) {
    console.error("Failed to fetch media file:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
