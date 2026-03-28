import { supabase } from '@/lib/supabase'
import { PairWithApartments } from '@/lib/supabase'
import GameClient from '@/components/GameClient'
import StreakDisplay from '@/components/StreakDisplay'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

async function getTodaysPair(): Promise<PairWithApartments | null> {
  const today = new Date().toISOString().split('T')[0]

  const { data: pair } = await supabase
    .from('daily_pairs')
    .select('*')
    .eq('date', today)
    .single()

  if (!pair) return null

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
  }
}

export default async function HomePage() {
  const pair = await getTodaysPair()

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="w-full border-b border-white/5 bg-[#0f0f0f]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black tracking-tight text-teal-400">Rentle</span>
            <span className="text-white/20 text-xs hidden sm:block">daily apartment value game</span>
          </div>
          <div className="flex items-center gap-3">
            <StreakDisplay />
            <Link
              href="/admin"
              className="text-white/30 hover:text-white/60 text-xs transition-colors"
            >
              Admin
            </Link>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Which apartment is better value?
          </h1>
          <p className="text-white/40 text-sm">
            Vote for the one you think is the better deal for the money
          </p>
        </div>

        {pair ? (
          <GameClient pair={pair} />
        ) : (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <p className="text-4xl">🏠</p>
            <p className="text-white/60 text-lg">No apartment pair scheduled for today.</p>
            <p className="text-white/30 text-sm">Check back later or add one in the admin panel.</p>
            <Link
              href="/admin"
              className="mt-2 px-4 py-2 bg-teal-500 hover:bg-teal-400 rounded-lg text-white text-sm font-medium transition-colors"
            >
              Go to Admin
            </Link>
          </div>
        )}
      </main>

      <footer className="text-center text-white/20 text-xs py-6">
        Rentle — built for apartment nerds
      </footer>
    </div>
  )
}
