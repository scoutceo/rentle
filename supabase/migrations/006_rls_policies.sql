-- Enable RLS and set permissive read/write policies on all tables
-- Tighten further when proper auth is introduced

ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "votes_insert" ON votes;
DROP POLICY IF EXISTS "votes_select" ON votes;
CREATE POLICY "votes_insert" ON votes FOR INSERT WITH CHECK (true);
CREATE POLICY "votes_select" ON votes FOR SELECT USING (true);

ALTER TABLE apartments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "apartments_select" ON apartments;
CREATE POLICY "apartments_select" ON apartments FOR SELECT USING (true);

ALTER TABLE daily_pairs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "daily_pairs_select" ON daily_pairs;
CREATE POLICY "daily_pairs_select" ON daily_pairs FOR SELECT USING (true);
