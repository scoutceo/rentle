import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const today = new Date().toISOString().split('T')[0]

  const { data: pair, error: pairError } = await supabase
    .from('daily_pairs')
    .select('*')
    .eq('date', today)
    .single()

  if (pairError || !pair) {
    return NextResponse.json({ error: 'No pair for today' }, { status: 404 })
  }

  const [{ data: aptA }, { data: aptB }] = await Promise.all([
    supabase.from('apartments').select('*').eq('id', pair.apartment_a_id).single(),
    supabase.from('apartments').select('*').eq('id', pair.apartment_b_id).single(),
  ])

  if (!aptA || !aptB) {
    return NextResponse.json({ error: 'Apartments not found' }, { status: 404 })
  }

  const { data: votes } = await supabase
    .from('votes')
    .select('choice')
    .eq('pair_id', pair.id)

  const votes_a = votes?.filter((v) => v.choice === 'A').length ?? 0
  const votes_b = votes?.filter((v) => v.choice === 'B').length ?? 0

  return NextResponse.json({
    id: pair.id,
    date: pair.date,
    apartment_a: aptA,
    apartment_b: aptB,
    votes_a,
    votes_b,
  })
}
