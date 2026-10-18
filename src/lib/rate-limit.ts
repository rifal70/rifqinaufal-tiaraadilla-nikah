import crypto from "crypto";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * Distributed rate limit backed by Postgres (see migration 002).
 * IP is hashed so raw IPs are never stored.
 * Fails OPEN on DB error to avoid locking out guests during transient issues.
 */
export async function isAllowed(scope: string, ip: string, max: number, windowSeconds: number): Promise<boolean> {
  const bucket = `${scope}:${crypto.createHash("sha256").update(ip).digest("hex").slice(0, 32)}`;
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase.rpc("check_rate_limit", {
      p_bucket: bucket,
      p_max: max,
      p_window_seconds: windowSeconds,
    });
    if (error) return true;
    return data === true;
  } catch {
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
