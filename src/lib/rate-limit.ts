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
