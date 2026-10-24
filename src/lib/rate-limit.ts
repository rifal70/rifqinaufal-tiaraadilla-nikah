import crypto from "crypto";
import { query } from "@/lib/neon/db";

/**
 * Distributed rate limit backed by Neon Postgres.
 * IP is hashed so raw IPs are never stored.
 * Fails OPEN on DB error to avoid locking out guests during transient issues.
 */
export async function isAllowed(scope: string, ip: string, max: number, windowSeconds: number): Promise<boolean> {
  const bucket = `${scope}:${crypto.createHash("sha256").update(ip).digest("hex").slice(0, 32)}`;
  try {
    const rows = await query<{ allowed: boolean }>(
      "SELECT check_rate_limit($1, $2, $3) AS allowed",
      [bucket, max, windowSeconds]
    );
    return rows[0]?.allowed === true;
  } catch (err) {
    console.error("Rate limit check error:", err);
    return true;
  }
}

export function clientIp(headers: Headers): string {
  return (
    headers.get("x-nf-client-connection-ip") ||
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}

// Fast in-memory rate limiter (Zero DB queries, protects server & DB during surges)
interface MemoryBucket {
  count: number;
  resetAt: number;
}
const memoryBuckets = new Map<string, MemoryBucket>();

// Periodic cleanup every 60s
if (typeof setInterval !== "undefined") {
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of memoryBuckets.entries()) {
      if (record.resetAt <= now) {
        memoryBuckets.delete(key);
      }
    }
  }, 60000);
  if (timer.unref) timer.unref();
}

export function isAllowedInMemory(key: string, max: number, windowSeconds: number): boolean {
  const now = Date.now();
  const record = memoryBuckets.get(key);

  if (!record || record.resetAt <= now) {
    memoryBuckets.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return true;
  }

  if (record.count >= max) {
    return false;
  }

  record.count += 1;
  return true;
}

