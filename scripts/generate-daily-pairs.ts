/**
 * generate-daily-pairs.ts
 *
 * Generates 5 random apartment pairs per day for the next N days,
 * skipping any dates that already have pairs in daily_pairs.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/generate-daily-pairs.ts [--days 14]
 *
 * Run daily via cron to keep the schedule rolling.
 */

import { createClient } from '@supabase/supabase-js'

const ROUNDS_PER_DAY = 5
const DEFAULT_DAYS_AHEAD = 14

function requireEnv(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required env var: ${name}`)
  return value
}

function getEasternDateKey(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

function getDateOffsetInEastern(days: number, from = new Date()) {
  const copy = new Date(from)
  copy.setDate(copy.getDate() + days)
  return getEasternDateKey(copy)
}

// Fisher-Yates shuffle
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function pickPairsForDay(ids: string[], count: number): Array<[string, string]> {
  if (ids.length < count * 2) {
    throw new Error(`Need at least ${count * 2} apartments to generate ${count} pairs, have ${ids.length}`)
  }
  const shuffled = shuffle(ids)
  const pairs: Array<[string, string]> = []
  for (let i = 0; i < count; i++) {
    pairs.push([shuffled[i * 2], shuffled[i * 2 + 1]])
  }
  return pairs
}

async function main() {
  const args = process.argv.slice(2)
  const daysIndex = args.indexOf('--days')
  const daysAhead = daysIndex !== -1 ? parseInt(args[daysIndex + 1], 10) : DEFAULT_DAYS_AHEAD

  const supabaseUrl = requireEnv('NEXT_PUBLIC_SUPABASE_URL')
  const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY')
  const supabase = createClient(supabaseUrl, serviceRoleKey)

  // Fetch all hosted (real photo) apartments
  const { data: apartments, error: aptError } = await supabase
    .from('apartments')
    .select('id')
    .eq('photos_hosted', true)

  if (aptError) throw new Error(`Failed to fetch apartments: ${aptError.message}`)
  if (!apartments || apartments.length < ROUNDS_PER_DAY * 2) {
    throw new Error(`Not enough hosted apartments (${apartments?.length ?? 0}) to generate pairs`)
  }

  const allIds = apartments.map((a) => a.id)
  console.log(`Found ${allIds.length} hosted apartments`)

  // Determine which dates need pairs
  const today = getEasternDateKey()
  const targetDates: string[] = []
  for (let i = 0; i < daysAhead; i++) {
    targetDates.push(getDateOffsetInEastern(i))
  }

  // Fetch existing pair dates to skip
  const { data: existing, error: existingError } = await supabase
    .from('daily_pairs')
    .select('date')
    .in('date', targetDates)

  if (existingError) throw new Error(`Failed to fetch existing pairs: ${existingError.message}`)

  const existingDates = new Set((existing ?? []).map((r) => r.date))
  const missingDates = targetDates.filter((d) => !existingDates.has(d))

  if (missingDates.length === 0) {
    console.log(`✅ All ${daysAhead} days already have pairs. Nothing to do.`)
    return
  }

  console.log(`Generating pairs for ${missingDates.length} date(s): ${missingDates.join(', ')}`)

  const rows: Array<{
    date: string
    round_number: number
    apartment_a_id: string
    apartment_b_id: string
  }> = []

  for (const date of missingDates) {
    const pairs = pickPairsForDay(allIds, ROUNDS_PER_DAY)
    pairs.forEach(([a, b], i) => {
      rows.push({
        date,
        round_number: i + 1,
        apartment_a_id: a,
        apartment_b_id: b,
      })
    })
  }

  const { error: upsertError } = await supabase
    .from('daily_pairs')
    .upsert(rows, { onConflict: 'date,round_number', ignoreDuplicates: true })

  if (upsertError) throw new Error(`Failed to upsert pairs: ${upsertError.message}`)

  console.log(`✅ Inserted ${rows.length} pairs across ${missingDates.length} day(s)`)
  console.log('\n📅 Schedule:')
  for (const date of missingDates) {
    console.log(`  ${date} → ${ROUNDS_PER_DAY} rounds`)
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
