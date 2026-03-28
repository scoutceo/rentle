import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  let body: { pair_id: string; choice: 'A' | 'B' }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { pair_id, choice } = body

  if (!pair_id || !['A', 'B'].includes(choice)) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const { error } = await supabase.from('votes').insert({ pair_id, choice })

  if (error) {
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
