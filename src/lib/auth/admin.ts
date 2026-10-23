import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import crypto from "crypto";
import { query } from "@/lib/neon/db";

const ADMIN_SESSION_COOKIE_NAME = "wedding_admin_session";
const ADMIN_SESSION_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email?: string | null): boolean {
  return !!email && adminEmails().includes(email.toLowerCase());
}

/**
 * Verify admin password using either ADMIN_PASSWORD env variable or admin_users DB table.
 */
export async function verifyAdminCredentials(email: string, password: string): Promise<boolean> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!isAdminEmail(normalizedEmail)) return false;

  // 1. Check ADMIN_PASSWORD from environment variable
  const envPassword = process.env.ADMIN_PASSWORD;
  if (envPassword) {
    const bufA = Buffer.from(password);
    const bufB = Buffer.from(envPassword);
    if (bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB)) {
      return true;
    }
  }

  // 2. Check admin_users table in Neon (if configured)
  try {
    const rows = await query<{ password_hash: string }>(
      "SELECT password_hash FROM admin_users WHERE email = $1 LIMIT 1",
      [normalizedEmail]
    );
    if (rows.length && rows[0].password_hash) {
      const [salt, key] = rows[0].password_hash.split(":");
      if (salt && key) {
        const derived = crypto.scryptSync(password, salt, 64).toString("hex");
        const bufA = Buffer.from(derived);
        const bufB = Buffer.from(key);
        if (bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB)) {
          return true;
        }
      }
    }
  } catch {
    /* ignore DB lookup error */
  }

  return false;
}

/**
 * Create an admin session in Neon and set cookie.
 */
export async function createAdminSession(email: string): Promise<string> {
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + ADMIN_SESSION_TTL_SECONDS * 1000).toISOString();

  await query(
    "INSERT INTO sessions (id, admin_email, expires_at) VALUES ($1, $2, $3)",
    [sessionId, email.toLowerCase(), expiresAt]
  );

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_TTL_SECONDS,
  });

  return sessionId;
}

/**
 * Returns current admin user { email: string } or null.
 */
export async function getAdmin(): Promise<{ email: string } | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value;
  if (!sessionId) return null;

  try {
    const rows = await query<{ id: string; admin_email: string; expires_at: string }>(
      "SELECT id, admin_email, expires_at FROM sessions WHERE id = $1 AND admin_email IS NOT NULL LIMIT 1",
      [sessionId]
    );

    const session = rows[0];
    if (!session) return null;

    if (new Date(session.expires_at) < new Date()) {
      await query("DELETE FROM sessions WHERE id = $1", [session.id]);
      return null;
    }

    if (!isAdminEmail(session.admin_email)) {
      return null;
    }

    return { email: session.admin_email };
  } catch (err) {
    console.error("Failed to get admin session:", err);
    return null;
  }
}

export async function requireAdmin() {
  const user = await getAdmin();
  if (!user) redirect("/admin/login");
  return user;
}

export async function destroyAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value;
  if (sessionId) {
    try {
      await query("DELETE FROM sessions WHERE id = $1", [sessionId]);
    } catch {
      /* ignore */
    }
  }
  cookieStore.delete(ADMIN_SESSION_COOKIE_NAME);
}
