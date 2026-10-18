-- Migration 003: Per-invitation bank account visibility
-- Allows selective display of bank accounts per invitation link.

-- 1. Add visible_bank_ids array column to invitations
ALTER TABLE invitations 
ADD COLUMN IF NOT EXISTS visible_bank_ids UUID[] DEFAULT NULL;

-- 2. GIN index for fast containment checks if filtered via SQL queries
CREATE INDEX IF NOT EXISTS idx_invitations_visible_bank_ids 
ON invitations USING GIN (visible_bank_ids);

-- 3. (Optional) Backfill existing invitations with all active bank accounts
-- Uncomment if you want existing invitations to default to showing all current active banks:
-- UPDATE invitations
-- SET visible_bank_ids = ARRAY(
--   SELECT id FROM bank_accounts 
--   WHERE is_enabled = true AND bank_name <> '-'
-- )
-- WHERE visible_bank_ids IS NULL;