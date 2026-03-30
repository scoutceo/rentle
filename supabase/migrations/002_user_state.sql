-- Anonymous user state table (no auth required, keyed by a client-generated UUID)
CREATE TABLE IF NOT EXISTS user_state (
  user_id uuid NOT NULL,
  date date NOT NULL,
  rounds jsonb NOT NULL DEFAULT '[]',
  complete boolean NOT NULL DEFAULT false,
  streak integer NOT NULL DEFAULT 0,
  last_played date,
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, date)
);

CREATE INDEX IF NOT EXISTS user_state_user_idx ON user_state(user_id);

ALTER TABLE user_state ENABLE ROW LEVEL SECURITY;
-- Public can insert/update their own rows (anonymous, honor system — MVP)
CREATE POLICY "user_state_select" ON user_state FOR SELECT USING (true);
CREATE POLICY "user_state_insert" ON user_state FOR INSERT WITH CHECK (true);
CREATE POLICY "user_state_update" ON user_state FOR UPDATE USING (true);
