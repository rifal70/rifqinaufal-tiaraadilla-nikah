-- ============================================================
-- Neon PostgreSQL Setup for Wedding Party
-- Compatible with Neon Serverless Postgres
-- ============================================================

-- 1. INVITATIONS TABLE
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_name TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  guest_count INTEGER NOT NULL DEFAULT 1 CHECK (guest_count > 0),
  is_revoked BOOLEAN NOT NULL DEFAULT false,
  visible_bank_ids UUID[] DEFAULT NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invitations_token_hash ON invitations (token_hash);
CREATE INDEX IF NOT EXISTS idx_invitations_visible_bank_ids ON invitations USING GIN (visible_bank_ids);

-- 2. SESSIONS TABLE
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY,
  invitation_id UUID REFERENCES invitations(id) ON DELETE CASCADE,
  admin_email TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions (id, expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_invitation ON sessions (invitation_id);
CREATE INDEX IF NOT EXISTS idx_sessions_admin_email ON sessions (admin_email);

-- 3. ADMIN USERS TABLE (Opsional jika ingin multi-admin di DB)
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. BANK ACCOUNTS TABLE
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

-- 5. GALLERY IMAGES TABLE
CREATE TABLE IF NOT EXISTS gallery_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_path TEXT NOT NULL,
  alt_text TEXT,
  display_order INTEGER NOT NULL,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gallery_images_order ON gallery_images (display_order) WHERE is_visible = true;

-- 6. MEDIA FILES TABLE (Pengganti Supabase Storage untuk Neon)
CREATE TABLE IF NOT EXISTS media_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_path TEXT UNIQUE NOT NULL,
  content_type TEXT NOT NULL,
  data BYTEA NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_media_files_path ON media_files (file_path);

-- 7. SITE SETTINGS TABLE
CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. RATE LIMITS TABLE & STORED FUNCTION
CREATE TABLE IF NOT EXISTS rate_limits (
  bucket TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  reset_at TIMESTAMPTZ NOT NULL
);

CREATE OR REPLACE FUNCTION check_rate_limit(p_bucket TEXT, p_max INTEGER, p_window_seconds INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
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

-- 9. SEED BANK ACCOUNTS
INSERT INTO bank_accounts (bank_name, account_holder, account_number, display_order, is_enabled) VALUES
  ('Bank DKI', 'Wawan Gunawan', '001-312-8523', 1, true),
  ('Mandiri', 'Maghfira Tiara Adilla', '113-000-6987-589', 2, true),
  ('BRI', 'Pambudi Ningsih', '5642-01-027719-53-0', 3, true),
  ('-', '-', '-', 4, false)
ON CONFLICT (display_order) DO NOTHING;

-- 10. SEED DEFAULT SITE SETTINGS
INSERT INTO site_settings (key, value) VALUES
  ('opening_greeting', '[PLACEHOLDER — owner to provide exact religious greeting text]'),
  ('closing_greeting', '[PLACEHOLDER — owner to provide exact closing text]'),
  ('love_story', '[PLACEHOLDER — owner to provide love story text]'),
  ('digital_gift_text', '[PLACEHOLDER — owner to provide digital gift text]'),
  ('music_path', ''),
  ('map_image_path', ''),
  ('groom_photo_path', ''),
  ('bride_photo_path', '')
ON CONFLICT (key) DO NOTHING;
