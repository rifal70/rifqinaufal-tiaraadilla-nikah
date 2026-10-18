import { cookies } from "next/headers";
import crypto from "crypto";
import { createServiceClient } from "@/lib/supabase/server";

const SESSION_COOKIE_NAME = "wedding_session";

// Fallback jika belum diisi di database
const DEFAULT_EXPIRY_DAYS = 30;

/**
 * Mengambil tanggal kedaluwarsa dinamis dari database site_settings
 */
export async function getDynamicExpiryDate(): Promise<Date> {
  const supabase = createServiceClient();
  const { data: settings } = await supabase
    .from("site_settings")
    .select("key, value")
    .in("key", ["event_date", "event_expiry_days"]);

  const settingsMap = new Map((settings ?? []).map((s) => [s.key, s.value]));

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
  const supabase = createServiceClient();
  const tokenHash = hashToken(rawToken);

  const { data: invitation, error } = await supabase
    .from("invitations")
    .select("id, guest_name, visible_bank_ids, is_revoked, expires_at")
    .eq("token_hash", tokenHash)
    .single();

  if (error || !invitation || invitation.is_revoked) {
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
    const { data: existingSession } = await supabase
      .from("sessions")
      .select("id, invitation_id, expires_at")
      .eq("id", existingSessionId)
      .single();

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

  const { error: sessionError } = await supabase.from("sessions").insert({
    id: sessionId,
    invitation_id: invitation.id,
    expires_at: expiresAtIso,
  });

  if (sessionError) {
    console.error("Failed to create session:", sessionError.message);
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

  const supabase = createServiceClient();

  const { data: session, error } = await supabase
    .from("sessions")
    .select("id, invitation_id, expires_at")
    .eq("id", sessionCookie.value)
    .single();

  if (error || !session) {
    return null;
  }

  if (new Date(session.expires_at) < new Date()) {
    await supabase.from("sessions").delete().eq("id", session.id);
    return null;
  }

  const { data: invitation } = await supabase
    .from("invitations")
    .select("id, guest_name, visible_bank_ids, is_revoked")
    .eq("id", session.invitation_id)
    .single();

  if (!invitation || invitation.is_revoked) {
    await supabase.from("sessions").delete().eq("id", session.id);
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
    const supabase = createServiceClient();
    await supabase.from("sessions").delete().eq("id", sessionCookie.value);
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}