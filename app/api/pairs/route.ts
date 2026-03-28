import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const { data: pairs, error } = await supabase
    .from('daily_pairs')
    .select('*')
    .order('date', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const enriched = await Promise.all(
    (pairs ?? []).map(async (pair) => {
      const [{ data: aptA }, { data: aptB }, { data: votes }] = await Promise.all([
        supabase.from('apartments').select('*').eq('id', pair.apartment_a_id).single(),
        supabase.from('apartments').select('*').eq('id', pair.apartment_b_id).single(),
        supabase.from('votes').select('choice').eq('pair_id', pair.id),
      ])
      return {
        ...pair,
        apartment_a: aptA,
        apartment_b: aptB,
        votes_a: votes?.filter((v) => v.choice === 'A').length ?? 0,
        votes_b: votes?.filter((v) => v.choice === 'B').length ?? 0,
      }
    })
  )

  return NextResponse.json(enriched)
}

export async function POST(req: NextRequest) {
  let body: { date: string; apartment_a_id: string; apartment_b_id: string; round_number?: number }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { date, apartment_a_id, apartment_b_id, round_number = 1 } = body

  if (!date || !apartment_a_id || !apartment_b_id) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('daily_pairs')
    .insert({ date, apartment_a_id, apartment_b_id, round_number })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
