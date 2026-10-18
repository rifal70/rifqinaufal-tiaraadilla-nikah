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
