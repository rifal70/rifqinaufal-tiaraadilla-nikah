import { cookies } from "next/headers";
import crypto from "crypto";
import { createServiceClient } from "@/lib/supabase/server";

const SESSION_COOKIE_NAME = "wedding_session";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Hash a raw invitation token with SHA-256.
 * The raw token is never stored — only the hash.
 */
export function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

/**
 * Generate a cryptographically secure random token (256 bits = 32 bytes).
 * Returned as a URL-safe base64 string.
 */
export function generateToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

/**
 * Generate a cryptographically secure session ID.
 */
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
 * Validate the invitation token, create a session, and set the session cookie.
 * Returns the session data if successful, or null if the token is invalid.
 */
export async function validateTokenAndCreateSession(
  rawToken: string
): Promise<SessionData | null> {
  const supabase = createServiceClient();
  const tokenHash = hashToken(rawToken);

  // Look up invitation by token hash
  const { data: invitation, error } = await supabase
    .from("invitations")
    .select("id, guest_name, visible_bank_ids, is_revoked, expires_at")
    .eq("token_hash", tokenHash)
    .single();

  if (error || !invitation) {
    return null;
  }

  // Check if revoked
  if (invitation.is_revoked) {
    return null;
  }

  // Check if expired (if expiry is set)
  if (invitation.expires_at) {
    const expiresAt = new Date(invitation.expires_at);
    if (expiresAt < new Date()) {
      return null;
    }
  }

  // Create a new session
  const sessionId = generateSessionId();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();

  const { error: sessionError } = await supabase.from("sessions").insert({
    id: sessionId,
    invitation_id: invitation.id,
    expires_at: expiresAt,
  });

  if (sessionError) {
    console.error("Failed to create session:", sessionError.message);
    return null;
  }

  // Set the session cookie
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_MS / 1000, // in seconds
  });

  return {
    id: sessionId,
    invitation_id: invitation.id,
    guest_name: invitation.guest_name,
    visible_bank_ids: invitation.visible_bank_ids ?? null,
    expires_at: expiresAt,
  };
}

/**
 * Get the current session from the cookie.
 * Returns session data with guest info, or null if no valid session.
 */
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

  // Validate session exists and is not expired
  const { data: session, error } = await supabase
    .from("sessions")
    .select("id, invitation_id, expires_at")
    .eq("id", sessionCookie.value)
    .single();

  if (error || !session) {
    return null;
  }

  // Check expiry
  if (new Date(session.expires_at) < new Date()) {
    // Clean up expired session
    await supabase.from("sessions").delete().eq("id", session.id);
    return null;
  }

  // Get invitation data
  const { data: invitation } = await supabase
    .from("invitations")
    .select("id, guest_name, visible_bank_ids, is_revoked")
    .eq("id", session.invitation_id)
    .single();

  if (!invitation || invitation.is_revoked) {
    // Invitation was revoked — destroy session
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

/**
 * Destroy the current session (logout).
 */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (sessionCookie?.value) {
    const supabase = createServiceClient();
    await supabase.from("sessions").delete().eq("id", sessionCookie.value);
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}