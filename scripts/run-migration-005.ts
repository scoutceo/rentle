import { createClient } from '@supabase/supabase-js'

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Add user_id column to votes
  const { error: e1 } = await supabase
    .from('votes')
    .select('user_id')
    .limit(1)

  if (e1?.message?.includes('column "user_id" does not exist')) {
    console.log('user_id column missing — needs manual migration')
    console.log('\nRun this SQL in Supabase SQL editor:')
    console.log('ALTER TABLE votes ADD COLUMN IF NOT EXISTS user_id text;')
    console.log('CREATE UNIQUE INDEX IF NOT EXISTS votes_user_pair_unique ON votes (user_id, pair_id) WHERE user_id IS NOT NULL;')
  } else if (e1) {
    console.error('Error checking column:', e1.message)
  } else {
    console.log('✅ user_id column already exists on votes table')
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
