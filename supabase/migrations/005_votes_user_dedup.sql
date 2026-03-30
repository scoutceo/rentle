-- Add user_id to votes for deduplication
ALTER TABLE votes ADD COLUMN IF NOT EXISTS user_id text;

-- One vote per user per pair
CREATE UNIQUE INDEX IF NOT EXISTS votes_user_pair_unique
  ON votes (user_id, pair_id)
  WHERE user_id IS NOT NULL;
