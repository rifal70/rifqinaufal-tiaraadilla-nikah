import { NextRequest } from "next/server";
import { query } from "@/lib/neon/db";

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
    const rows = await query<{ content_type: string; data: Buffer }>(
      "SELECT content_type, data FROM media_files WHERE file_path = $1 LIMIT 1",
      [filePath]
    );

    if (!rows.length || !rows[0].data) {
      return new Response("Not Found", { status: 404 });
    }

    const item = rows[0];
    const dataBuffer = Buffer.isBuffer(item.data)
      ? item.data
      : Buffer.from(item.data as any);

    // Support range header for audio seeking
    const range = request.headers.get("range");
    const totalSize = dataBuffer.length;

    if (range && range.startsWith("bytes=")) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;

      if (!isNaN(start) && !isNaN(end) && start <= end && end < totalSize) {
        const chunk = dataBuffer.subarray(start, end + 1);
        return new Response(chunk, {
          status: 206,
          headers: {
            "Content-Range": `bytes ${start}-${end}/${totalSize}`,
            "Accept-Ranges": "bytes",
            "Content-Length": String(chunk.length),
            "Content-Type": item.content_type || "application/octet-stream",
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      }
    }

    return new Response(dataBuffer, {
      status: 200,
      headers: {
        "Content-Type": item.content_type || "application/octet-stream",
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
