import { createClient } from '@supabase/supabase-js'

const ROUNDS_PER_DAY = 5

function requireEnv(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required env var: ${name}`)
  return value
}

export function getServiceSupabase() {
  return createClient(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requireEnv('SUPABASE_SERVICE_ROLE_KEY')
  )
}

export function getEasternDateKey(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

export function getDateOffsetInEastern(days: number, from = new Date()) {
  const copy = new Date(from)
  copy.setDate(copy.getDate() + days)
  return getEasternDateKey(copy)
}

export function getEasternHour(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric',
    hour12: false,
  }).formatToParts(date)
  const hour = parts.find((part) => part.type === 'hour')?.value
  return hour ? parseInt(hour, 10) : 0
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

export async function generateMissingDailyPairs(daysAhead = 30) {
  const supabase = getServiceSupabase()

  const { data: apartments, error: aptError } = await supabase
    .from('apartments')
    .select('id')
    .eq('photos_hosted', true)

  if (aptError) throw new Error(`Failed to fetch apartments: ${aptError.message}`)
  if (!apartments || apartments.length < ROUNDS_PER_DAY * 2) {
    throw new Error(`Not enough hosted apartments (${apartments?.length ?? 0}) to generate pairs`)
  }

  const allIds = apartments.map((a) => a.id)
  const targetDates = Array.from({ length: daysAhead }, (_, i) => getDateOffsetInEastern(i))

  const { data: existing, error: existingError } = await supabase
    .from('daily_pairs')
    .select('date')
    .in('date', targetDates)

  if (existingError) throw new Error(`Failed to fetch existing pairs: ${existingError.message}`)

  const existingDates = new Set((existing ?? []).map((r) => r.date))
  const missingDates = targetDates.filter((d) => !existingDates.has(d))

  if (missingDates.length === 0) {
    return {
      apartmentCount: allIds.length,
      generatedDates: [],
      insertedRows: 0,
      skipped: true,
    }
  }

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

  return {
    apartmentCount: allIds.length,
    generatedDates: missingDates,
    insertedRows: rows.length,
    skipped: false,
  }
}
