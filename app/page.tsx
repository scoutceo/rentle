import { supabase } from '@/lib/supabase'
import { PairWithApartments } from '@/lib/supabase'
import { getEasternDateKey } from '@/lib/date'
import HomeWrapper from '@/components/HomeWrapper'

export const dynamic = 'force-dynamic'

async function getTodaysPairs(): Promise<PairWithApartments[]> {
  const today = getEasternDateKey()

  const { data: pairs } = await supabase
    .from('daily_pairs')
    .select('*')
    .eq('date', today)
    .order('round_number', { ascending: true })

  if (!pairs || pairs.length === 0) return []

  const enriched = await Promise.all(
    pairs.map(async (pair) => {
      const [{ data: aptA }, { data: aptB }, { data: votes }] = await Promise.all([
        supabase.from('apartments').select('*').eq('id', pair.apartment_a_id).single(),
        supabase.from('apartments').select('*').eq('id', pair.apartment_b_id).single(),
        supabase.from('votes').select('choice').eq('pair_id', pair.id),
      ])

      if (!aptA || !aptB) return null

      return {
        id: pair.id,
        date: pair.date,
        apartment_a: aptA,
        apartment_b: aptB,
        votes_a: votes?.filter((v) => v.choice === 'A').length ?? 0,
        votes_b: votes?.filter((v) => v.choice === 'B').length ?? 0,
      } as PairWithApartments
    })
  )

  return enriched.filter((p): p is PairWithApartments => p !== null)
}

export default async function HomePage() {
  const today = getEasternDateKey()
  const pairs = await getTodaysPairs()

  return <HomeWrapper pairs={pairs} date={today} />
}
