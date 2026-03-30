/**
 * replace-seeded-daily-pairs.ts
 *
 * Replaces existing daily_pairs for a date range with pairs built only from
 * real hosted apartments (photos_hosted=true), so old seeded synthetic pairs
 * stop appearing on the live site.
 *
 * For existing pair ids (including dates that already have votes), this script
 * first deletes votes tied to those pair ids, then updates/recreates the pairs.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/replace-seeded-daily-pairs.ts --days 14
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

  const targetDates = Array.from({ length: daysAhead }, (_, i) => getDateOffsetInEastern(i))

  const { data: apartments, error: aptError } = await supabase
    .from('apartments')
    .select('id')
    .eq('photos_hosted', true)

  if (aptError) throw new Error(`Failed to fetch hosted apartments: ${aptError.message}`)
  if (!apartments || apartments.length < ROUNDS_PER_DAY * 2) {
    throw new Error(`Not enough hosted apartments (${apartments?.length ?? 0}) to generate pairs`)
  }

  const { data: existingPairs, error: existingError } = await supabase
    .from('daily_pairs')
    .select('id,date,round_number')
    .in('date', targetDates)
    .order('date', { ascending: true })
    .order('round_number', { ascending: true })

  if (existingError) throw new Error(`Failed to fetch existing daily pairs: ${existingError.message}`)

  const ids = apartments.map((a) => a.id)
  console.log(`Found ${ids.length} hosted apartments`)
  console.log(`Replacing daily pairs for: ${targetDates.join(', ')}`)

  const existingIds = (existingPairs ?? []).map((p) => p.id)
  if (existingIds.length > 0) {
    const { error: deleteVotesError } = await supabase
      .from('votes')
      .delete()
      .in('pair_id', existingIds)

    if (deleteVotesError) throw new Error(`Failed to delete existing votes: ${deleteVotesError.message}`)
  }

  const existingByKey = new Map((existingPairs ?? []).map((p) => [`${p.date}::${p.round_number}`, p.id]))

  const updateRows: Array<{
    id: string
    date: string
    round_number: number
    apartment_a_id: string
    apartment_b_id: string
  }> = []

  const insertRows: Array<{
    date: string
    round_number: number
    apartment_a_id: string
    apartment_b_id: string
  }> = []

  for (const date of targetDates) {
    const pairs = pickPairsForDay(ids, ROUNDS_PER_DAY)
    pairs.forEach(([a, b], index) => {
      const roundNumber = index + 1
      const existingId = existingByKey.get(`${date}::${roundNumber}`)
      if (existingId) {
        updateRows.push({
          id: existingId,
          date,
          round_number: roundNumber,
          apartment_a_id: a,
          apartment_b_id: b,
        })
      } else {
        insertRows.push({
          date,
          round_number: roundNumber,
          apartment_a_id: a,
          apartment_b_id: b,
        })
      }
    })
  }

  if (updateRows.length > 0) {
    const { error: updateError } = await supabase
      .from('daily_pairs')
      .upsert(updateRows, { onConflict: 'id' })

    if (updateError) throw new Error(`Failed to update existing daily pairs: ${updateError.message}`)
  }

  if (insertRows.length > 0) {
    const { error: insertError } = await supabase
      .from('daily_pairs')
      .insert(insertRows)

    if (insertError) throw new Error(`Failed to insert missing daily pairs: ${insertError.message}`)
  }

  console.log(`✅ Updated ${updateRows.length} existing pairs and inserted ${insertRows.length} new pairs across ${targetDates.length} day(s)`)
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
