-- Migration 001: Initial schema for wedding invitation website
-- Created: 2026-10-17
-- Description: Creates invitations, sessions, bank_accounts, gallery_images, and site_settings tables.

-- ============================================================
-- 1. INVITATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_name TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  guest_count INTEGER NOT NULL DEFAULT 1 CHECK (guest_count > 0),
  is_revoked BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast token hash lookups
CREATE INDEX IF NOT EXISTS idx_invitations_token_hash ON invitations (token_hash);

-- ============================================================
-- 2. SESSIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY,
  invitation_id UUID NOT NULL REFERENCES invitations(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for session validation queries
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions (id, expires_at);

-- ============================================================
-- 3. BANK ACCOUNTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_name TEXT NOT NULL,
  account_holder TEXT NOT NULL,
  account_number TEXT NOT NULL,
  instructions TEXT,
  display_order INTEGER NOT NULL UNIQUE,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 4. GALLERY IMAGES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS gallery_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_path TEXT NOT NULL,
  alt_text TEXT,
  display_order INTEGER NOT NULL,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gallery_images_order ON gallery_images (display_order) WHERE is_visible = true;

-- ============================================================
-- 5. SITE SETTINGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 6. ENABLE RLS ON ALL TABLES
-- ============================================================
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 7. RLS POLICIES
-- ============================================================

-- INVITATIONS: No direct access via anon or authenticated roles.
-- All access goes through service-role (server-side API routes).
-- Admin access is handled via Supabase Auth + service role.

-- SESSIONS: Same â€” server-side only via service role.
-- No RLS policies for anon/authenticated = deny all (RLS enabled, no ALLOW = deny).

-- BANK ACCOUNTS: Read-only for authenticated sessions (via API route, not direct).
-- We still add a SELECT policy for safety.
CREATE POLICY "Allow read bank_accounts for all" ON bank_accounts
  FOR SELECT USING (true);

-- GALLERY IMAGES: Read-only for visible images.
CREATE POLICY "Allow read visible gallery_images" ON gallery_images
  FOR SELECT USING (is_visible = true);

-- SITE SETTINGS: Public read for non-sensitive settings.
CREATE POLICY "Allow read site_settings" ON site_settings
  FOR SELECT USING (true);

-- ============================================================
-- 8. SEED BANK ACCOUNTS (from owner-provided data)
-- ============================================================
INSERT INTO bank_accounts (bank_name, account_holder, account_number, display_order, is_enabled) VALUES
  ('Bank DKI', 'Wawan Gunawan', '001-312-8523', 1, true),
  ('Mandiri', 'Maghfira Tiara Adilla', '113-000-6987-589', 2, true),
  ('BRI', 'Pambudi Ningsih', '5642-01-027719-53-0', 3, true),
  ('-', '-', '-', 4, false)
ON CONFLICT (display_order) DO NOTHING;

-- ============================================================
-- 9. SEED DEFAULT SITE SETTINGS
-- ============================================================
INSERT INTO site_settings (key, value) VALUES
  ('opening_greeting', '[PLACEHOLDER — owner to provide exact religious greeting text]'),
  ('closing_greeting', '[PLACEHOLDER — owner to provide exact closing text]'),
  ('love_story', '[PLACEHOLDER — owner to provide love story text]'),
  ('digital_gift_text', '[PLACEHOLDER — owner to provide digital gift text]'),
  ('music_url', ''),
  ('couple_photo_url', '')
ON CONFLICT (key) DO NOTHING;
-- Migration 002: Distributed rate limiting + private gallery bucket
-- Rate limit state lives in Postgres so it works across all Netlify function instances.

CREATE TABLE IF NOT EXISTS rate_limits (
  bucket TEXT PRIMARY KEY,           -- e.g. 'invite:<sha256(ip)>'
  count INTEGER NOT NULL DEFAULT 0,
  reset_at TIMESTAMPTZ NOT NULL
);
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY; -- no policies = service role only

-- Atomic check-and-increment. Returns TRUE if the request is allowed.
CREATE OR REPLACE FUNCTION check_rate_limit(p_bucket TEXT, p_max INTEGER, p_window_seconds INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  INSERT INTO rate_limits (bucket, count, reset_at)
  VALUES (p_bucket, 1, now() + make_interval(secs => p_window_seconds))
  ON CONFLICT (bucket) DO UPDATE
    SET count = CASE WHEN rate_limits.reset_at < now() THEN 1 ELSE rate_limits.count + 1 END,
        reset_at = CASE WHEN rate_limits.reset_at < now()
                        THEN now() + make_interval(secs => p_window_seconds)
                        ELSE rate_limits.reset_at END
  RETURNING count INTO v_count;
  RETURN v_count <= p_max;
END;
$$;
REVOKE ALL ON FUNCTION check_rate_limit(TEXT, INTEGER, INTEGER) FROM PUBLIC, anon, authenticated;

-- Tighten read policies: all guest reads go through the server (service role),
-- so anon/authenticated roles need no direct access.
DROP POLICY IF EXISTS "Allow read bank_accounts for all" ON bank_accounts;
DROP POLICY IF EXISTS "Allow read visible gallery_images" ON gallery_images;
DROP POLICY IF EXISTS "Allow read site_settings" ON site_settings;

-- Index for session cleanup by invitation
CREATE INDEX IF NOT EXISTS idx_sessions_invitation ON sessions (invitation_id);

-- Private storage bucket for gallery (served via short-lived signed URLs only)
INSERT INTO storage.buckets (id, name, public)
VALUES ('gallery', 'gallery', false)
ON CONFLICT (id) DO NOTHING;



-- 1. Add visible_bank_ids array column to invitations
ALTER TABLE invitations 
ADD COLUMN IF NOT EXISTS visible_bank_ids UUID[] DEFAULT NULL;

-- 2. GIN index for fast containment checks if filtered via SQL queries
CREATE INDEX IF NOT EXISTS idx_invitations_visible_bank_ids 
ON invitations USING GIN (visible_bank_ids);