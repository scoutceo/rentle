import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const today = new Date().toISOString().split('T')[0]

  const { data: pairs, error: pairsError } = await supabase
    .from('daily_pairs')
    .select('*')
    .eq('date', today)
    .order('round_number', { ascending: true })

  if (pairsError || !pairs || pairs.length === 0) {
    return NextResponse.json({ error: 'No pairs for today' }, { status: 404 })
  }

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
        round_number: pair.round_number,
        apartment_a: aptA,
        apartment_b: aptB,
        votes_a: votes?.filter((v) => v.choice === 'A').length ?? 0,
        votes_b: votes?.filter((v) => v.choice === 'B').length ?? 0,
      }
    })
  )

  const valid = enriched.filter(Boolean)
  if (valid.length === 0) {
    return NextResponse.json({ error: 'Apartments not found' }, { status: 404 })
  }

  return NextResponse.json(valid)
}
