import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  let body: { pair_id: string; choice: 'A' | 'B'; user_id?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { pair_id, choice, user_id } = body

  if (!pair_id || !['A', 'B'].includes(choice)) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  // If user_id provided, check for duplicate vote
  if (user_id) {
    const { data: existing } = await supabase
      .from('votes')
      .select('id')
      .eq('pair_id', pair_id)
      .eq('user_id', user_id)
      .maybeSingle()

    if (existing) {
      // Already voted — just return current counts without inserting
      const { data: votes } = await supabase
        .from('votes')
        .select('choice')
        .eq('pair_id', pair_id)

      const votes_a = votes?.filter((v) => v.choice === 'A').length ?? 0
      const votes_b = votes?.filter((v) => v.choice === 'B').length ?? 0
      return NextResponse.json({ votes_a, votes_b, duplicate: true })
    }
  }

  const { error } = await supabase
    .from('votes')
    .insert({ pair_id, choice, ...(user_id ? { user_id } : {}) })

  if (error) {
    // Unique constraint violation — duplicate vote at DB level
    if (error.code === '23505') {
      const { data: votes } = await supabase
        .from('votes')
        .select('choice')
        .eq('pair_id', pair_id)

      const votes_a = votes?.filter((v) => v.choice === 'A').length ?? 0
      const votes_b = votes?.filter((v) => v.choice === 'B').length ?? 0
      return NextResponse.json({ votes_a, votes_b, duplicate: true })
    }

    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data: votes } = await supabase
    .from('votes')
    .select('choice')
    .eq('pair_id', pair_id)

  const votes_a = votes?.filter((v) => v.choice === 'A').length ?? 0
  const votes_b = votes?.filter((v) => v.choice === 'B').length ?? 0

  return NextResponse.json({ votes_a, votes_b })
}
