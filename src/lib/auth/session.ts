import { cookies } from "next/headers";
import crypto from "crypto";
import { query } from "@/lib/neon/db";

const SESSION_COOKIE_NAME = "wedding_session";

// Fallback jika belum diisi di database
const DEFAULT_EXPIRY_DAYS = 30;

/**
 * Mengambil tanggal kedaluwarsa dinamis dari database site_settings
 */
export async function getDynamicExpiryDate(): Promise<Date> {
  try {
    const rows = await query<{ key: string; value: string }>(
      "SELECT key, value FROM site_settings WHERE key IN ('event_date', 'event_expiry_days')"
    );

    const settingsMap = new Map(rows.map((s) => [s.key, s.value]));

    const eventDateStr = settingsMap.get("event_date");
    const expiryDaysStr = settingsMap.get("event_expiry_days");

    const expiryDays = expiryDaysStr ? parseInt(expiryDaysStr, 10) || DEFAULT_EXPIRY_DAYS : DEFAULT_EXPIRY_DAYS;

    if (eventDateStr) {
      const baseEventDate = new Date(eventDateStr);
      if (!isNaN(baseEventDate.getTime())) {
        // Tanggal acara + X hari (pukul 23:59:59)
        return new Date(baseEventDate.getTime() + expiryDays * 24 * 60 * 60 * 1000);
      }
    }

    // Fallback jika event_date kosong: sekarang + X hari
    return new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);
  } catch {
    return new Date(Date.now() + DEFAULT_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
  }
}

export function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

export function generateSessionId(): string {
  return crypto.randomUUID();
}

export interface SessionData {
  id: string;
  invitation_id: string;
  guest_name: string;
  visible_bank_ids: string[] | null;
  expires_at: string;
}

/**
 * Validate token, create session, dan set cookie dengan expiry dinamis
 */
export async function validateTokenAndCreateSession(
  rawToken: string
): Promise<SessionData | null> {
  const tokenHash = hashToken(rawToken);

  const invitations = await query<{
    id: string;
    guest_name: string;
    visible_bank_ids: string[] | null;
    is_revoked: boolean;
    expires_at: string | null;
  }>(
    "SELECT id, guest_name, visible_bank_ids, is_revoked, expires_at FROM invitations WHERE token_hash = $1 LIMIT 1",
    [tokenHash]
  );

  const invitation = invitations[0];
  if (!invitation || invitation.is_revoked) {
    return null;
  }

  if (invitation.expires_at) {
    const expiresAt = new Date(invitation.expires_at);
    if (expiresAt < new Date()) {
      return null;
    }
  }

  // Ambil tanggal expiry dinamis dari site_settings
  const targetExpiryDate = await getDynamicExpiryDate();
  const now = Date.now();
  const expiryTime = targetExpiryDate.getTime();

  if (now >= expiryTime) {
    return null;
  }

  const cookieStore = await cookies();
  const existingSessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const maxAgeInSeconds = Math.max(0, Math.floor((expiryTime - now) / 1000));
  const expiresAtIso = targetExpiryDate.toISOString();

  // Re-use session jika sudah ada di browser ini & masih valid
  if (existingSessionId) {
    const existingSessions = await query<{
      id: string;
      invitation_id: string;
      expires_at: string;
    }>(
      "SELECT id, invitation_id, expires_at FROM sessions WHERE id = $1 LIMIT 1",
      [existingSessionId]
    );

    const existingSession = existingSessions[0];
    if (
      existingSession &&
      existingSession.invitation_id === invitation.id &&
      new Date(existingSession.expires_at) > new Date()
    ) {
      cookieStore.set(SESSION_COOKIE_NAME, existingSession.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: maxAgeInSeconds,
      });

      return {
        id: existingSession.id,
        invitation_id: invitation.id,
        guest_name: invitation.guest_name,
        visible_bank_ids: invitation.visible_bank_ids ?? null,
        expires_at: existingSession.expires_at,
      };
    }
  }

  const sessionId = generateSessionId();

  try {
    await query(
      "INSERT INTO sessions (id, invitation_id, expires_at) VALUES ($1, $2, $3)",
      [sessionId, invitation.id, expiresAtIso]
    );
  } catch (sessionError) {
    console.error("Failed to create session in Neon:", sessionError);
    return null;
  }

  cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeInSeconds,
  });

  return {
    id: sessionId,
    invitation_id: invitation.id,
    guest_name: invitation.guest_name,
    visible_bank_ids: invitation.visible_bank_ids ?? null,
    expires_at: expiresAtIso,
  };
}

export async function getSession(): Promise<{
  session_id: string;
  invitation_id: string;
  guest_name: string;
  visible_bank_ids: string[] | null;
} | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (!sessionCookie?.value) {
    return null;
  }

  const sessions = await query<{
    id: string;
    invitation_id: string;
    expires_at: string;
  }>(
    "SELECT id, invitation_id, expires_at FROM sessions WHERE id = $1 LIMIT 1",
    [sessionCookie.value]
  );

  const session = sessions[0];
  if (!session) {
    return null;
  }

  if (new Date(session.expires_at) < new Date()) {
    await query("DELETE FROM sessions WHERE id = $1", [session.id]);
    return null;
  }

  const invitations = await query<{
    id: string;
    guest_name: string;
    visible_bank_ids: string[] | null;
    is_revoked: boolean;
  }>(
    "SELECT id, guest_name, visible_bank_ids, is_revoked FROM invitations WHERE id = $1 LIMIT 1",
    [session.invitation_id]
  );

  const invitation = invitations[0];
  if (!invitation || invitation.is_revoked) {
    await query("DELETE FROM sessions WHERE id = $1", [session.id]);
    return null;
  }

  return {
    session_id: session.id,
    invitation_id: invitation.id,
    guest_name: invitation.guest_name,
    visible_bank_ids: invitation.visible_bank_ids ?? null,
  };
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (sessionCookie?.value) {
    await query("DELETE FROM sessions WHERE id = $1", [sessionCookie.value]);
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}