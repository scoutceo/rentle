/**
 * Migration script — run once to:
 * 1. Deduplicate apartments (keep oldest, remap daily_pairs foreign keys)
 * 2. Deduplicate daily_pairs (keep oldest per date+round, delete orphan votes)
 * 3. Add unique constraints on both tables
 * 4. Create user_state table for streak persistence
 */
import { createClient } from '@supabase/supabase-js'

const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!

if (!SERVICE_KEY || !SUPABASE_URL) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

async function run() {
  console.log('🔍 Fetching all apartments...')
  const { data: allApts, error: aptErr } = await supabase
    .from('apartments')
    .select('id, city, neighborhood, address_label, created_at')
    .order('created_at', { ascending: true })
  if (aptErr) throw new Error('fetch apartments: ' + aptErr.message)

  // Build map: "city|neighborhood|address_label" → canonical (first/oldest) id
  const canonicalApt = new Map<string, string>()
  const dupAptIds: string[] = []
  for (const apt of allApts!) {
    const key = `${apt.city}|${apt.neighborhood}|${apt.address_label}`
    if (!canonicalApt.has(key)) {
      canonicalApt.set(key, apt.id)
    } else {
      dupAptIds.push(apt.id)
    }
  }
  console.log(`  ${allApts!.length} apartments total, ${dupAptIds.length} duplicates to remove`)

  if (dupAptIds.length > 0) {
    // Build reverse map: dupId → canonicalId
    const dupToCanonical = new Map<string, string>()
    for (const apt of allApts!) {
      const key = `${apt.city}|${apt.neighborhood}|${apt.address_label}`
      const canonical = canonicalApt.get(key)!
      if (apt.id !== canonical) {
        dupToCanonical.set(apt.id, canonical)
      }
    }

    // Fetch all pairs
    console.log('🔍 Fetching all daily_pairs...')
    const { data: allPairs, error: pairFetchErr } = await supabase
      .from('daily_pairs')
      .select('id, apartment_a_id, apartment_b_id')
    if (pairFetchErr) throw new Error('fetch pairs: ' + pairFetchErr.message)

    // Remap pairs pointing to duplicate apartment IDs
    let remapped = 0
    for (const pair of allPairs!) {
      const newA = dupToCanonical.get(pair.apartment_a_id)
      const newB = dupToCanonical.get(pair.apartment_b_id)
      if (newA || newB) {
        const update: Record<string, string> = {}
        if (newA) update.apartment_a_id = newA
        if (newB) update.apartment_b_id = newB
        const { error: updateErr } = await supabase
          .from('daily_pairs')
          .update(update)
          .eq('id', pair.id)
        if (updateErr) throw new Error(`remap pair ${pair.id}: ` + updateErr.message)
        remapped++
      }
    }
    console.log(`  Remapped ${remapped} pairs to canonical apartment IDs`)

    // Now delete duplicate apartments
    console.log('🗑️  Deleting duplicate apartments...')
    const { error: delAptErr } = await supabase
      .from('apartments')
      .delete()
      .in('id', dupAptIds)
    if (delAptErr) throw new Error('delete dup apartments: ' + delAptErr.message)
    console.log(`  Deleted ${dupAptIds.length} duplicate apartments`)
  }

  // Deduplicate daily_pairs
  console.log('🔍 Fetching all daily_pairs for dedup...')
  const { data: allPairs2, error: p2err } = await supabase
    .from('daily_pairs')
    .select('id, date, round_number, created_at')
    .order('created_at', { ascending: true })
  if (p2err) throw new Error('fetch pairs2: ' + p2err.message)

  const canonicalPair = new Map<string, string>()
  const dupPairIds: string[] = []
  for (const pair of allPairs2!) {
    const key = `${pair.date}|${pair.round_number}`
    if (!canonicalPair.has(key)) {
      canonicalPair.set(key, pair.id)
    } else {
      dupPairIds.push(pair.id)
    }
  }
  console.log(`  ${allPairs2!.length} pairs total, ${dupPairIds.length} duplicates to remove`)

  if (dupPairIds.length > 0) {
    // Delete votes referencing duplicate pairs
    console.log('🗑️  Deleting votes for duplicate pairs...')
    const { error: delVoteErr } = await supabase
      .from('votes')
      .delete()
      .in('pair_id', dupPairIds)
    if (delVoteErr) throw new Error('delete dup votes: ' + delVoteErr.message)

    // Delete duplicate pairs
    console.log('🗑️  Deleting duplicate pairs...')
    const { error: delPairErr } = await supabase
      .from('daily_pairs')
      .delete()
      .in('id', dupPairIds)
    if (delPairErr) throw new Error('delete dup pairs: ' + delPairErr.message)
    console.log(`  Deleted ${dupPairIds.length} duplicate pairs`)
  }

  console.log('\n✅ Deduplication complete!')
  console.log('\n⚠️  Still need to run in Supabase SQL editor:')
  console.log(`
ALTER TABLE apartments ADD CONSTRAINT apartments_identity_unique
  UNIQUE (city, neighborhood, address_label);

ALTER TABLE daily_pairs ADD CONSTRAINT daily_pairs_date_round_unique
  UNIQUE (date, round_number);

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
CREATE POLICY "user_state_select" ON user_state FOR SELECT USING (true);
CREATE POLICY "user_state_insert" ON user_state FOR INSERT WITH CHECK (true);
CREATE POLICY "user_state_update" ON user_state FOR UPDATE USING (true);
  `)
}

run().catch((e) => {
  console.error('❌', e.message)
  process.exit(1)
})
