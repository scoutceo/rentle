'use client'

import { useState } from 'react'
import GameClient from './GameClient'
import StreakDisplay from './StreakDisplay'
import { PairWithApartments } from '@/lib/supabase'

type Props = {
  pairs: PairWithApartments[]
  date: string
}

export default function HomeWrapper({ pairs, date }: Props) {
  const [inGame, setInGame] = useState(false)

  if (inGame) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="w-full border-b border-white/5 bg-[#0f0f0f]/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <button
              onClick={() => setInGame(false)}
              className="text-xl font-black tracking-tighter text-teal-400 hover:text-teal-300 transition-colors"
            >
              RENTLE
            </button>
            <StreakDisplay />
          </div>
        </header>

        <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-8 md:py-10">
          {pairs.length > 0 ? (
            <GameClient pairs={pairs} date={date} />
          ) : (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <p className="text-4xl">🏠</p>
              <p className="text-white/60 text-lg">No matchups scheduled for today.</p>
              <p className="text-white/30 text-sm">Check back tomorrow!</p>
            </div>
          )}
        </main>

        <footer className="text-center text-white/20 text-xs py-6">
          Rentle — built for apartment nerds
        </footer>
      </div>
    )
  }

  return <LandingPage onPlay={() => setInGame(true)} hasPairs={pairs.length > 0} />
}

type ModalType = 'how-it-works' | 'about' | null

function LandingPage({ onPlay, hasPairs }: { onPlay: () => void; hasPairs: boolean }) {
  const [modal, setModal] = useState<ModalType>(null)
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-blue-900">
      {/* Atmospheric blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div className="absolute top-[-8%] right-[-4%] w-[55vw] h-[55vw] max-w-[640px] max-h-[640px] rounded-full bg-teal-500/[0.07] blur-[130px]" />
        <div className="absolute bottom-[-4%] left-[-8%] w-[50vw] h-[50vw] max-w-[580px] max-h-[580px] rounded-full bg-amber-500/[0.05] blur-[110px]" />
        <div className="absolute top-[45%] left-[28%] w-[40vw] h-[40vw] max-w-[460px] max-h-[460px] rounded-full bg-indigo-500/[0.04] blur-[90px]" />
      </div>

      {/* Portal card */}
      <div className="relative z-10 w-full max-w-lg mx-auto px-6 py-12 md:px-8 md:py-16 flex flex-col items-center gap-10">

        {/* Title lockup */}
        <div className="text-center flex flex-col items-center gap-3">
          <h1 className="text-[5.75rem] sm:text-[7rem] md:text-[7.75rem] font-black tracking-tighter text-white leading-none select-none">
            RENTLE
          </h1>
          <p className="text-white/55 text-[1.05rem] sm:text-lg font-medium tracking-wide">
            The daily apartment value game
          </p>
          <p className="text-white/30 text-sm sm:text-[0.95rem] max-w-[320px] text-center leading-relaxed">
            Two real listings. Pick the better deal.<br />See how the crowd voted.
          </p>
        </div>

        {/* Tiles */}
        <div className="w-full flex flex-col gap-4">

          {/* Daily — primary CTA */}
          <button
            onClick={hasPairs ? onPlay : undefined}
            disabled={!hasPairs}
            className={[
              'w-full rounded-2xl px-5 py-5 sm:px-6 sm:py-5 flex items-center justify-between border',
              'transition-all duration-200 active:scale-[0.98] group text-left',
              hasPairs
                ? 'bg-teal-500/10 border-teal-500/25 hover:bg-teal-500/18 hover:border-teal-400/40 cursor-pointer'
                : 'bg-white/5 border-white/10 cursor-not-allowed opacity-50',
            ].join(' ')}
          >
            <div className="flex flex-col gap-0.5">
              <span className="text-base font-bold text-white">Daily</span>
              <span className="text-xs text-white/35">
                {hasPairs
                  ? '5 matchups · refreshes each morning'
                  : 'No pairs today — check back later'}
              </span>
            </div>
            <div className={[
              'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-150',
              hasPairs ? 'bg-teal-400/15 text-teal-300 group-hover:translate-x-0.5' : 'bg-white/8 text-white/25',
            ].join(' ')}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          {/* History + Stats — disabled tiles */}
          <div className="grid grid-cols-2 gap-3">
            <DisabledTile
              icon={
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              }
              label="History"
            />
            <DisabledTile
              icon={
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              }
              label="Stats"
            />
          </div>
        </div>

        {/* Footer links */}
        <div className="flex items-center gap-3 text-white/20 text-xs">
          <button onClick={() => setModal('how-it-works')} className="hover:text-white/45 transition-colors">How it works</button>
          <span aria-hidden>·</span>
          <button onClick={() => setModal('about')} className="hover:text-white/45 transition-colors">About</button>
          <span aria-hidden>·</span>
          <a
            href="mailto:hello@rentle.lol?subject=Listing%20Suggestion&body=City%3A%0ANeighborhood%3A%0ALink%3A%0ARent%3A%0ABeds%2FBaths%3A"
            className="hover:text-white/45 transition-colors"
          >
            Suggest a listing
          </a>
        </div>
      </div>
      {/* Modals — inside container so overflow:hidden doesn't trap fixed overlay */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
          onClick={() => setModal(null)}
        >
          <div
            className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 max-w-sm w-full flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            {modal === 'how-it-works' && (
              <>
                <h2 className="text-white font-bold text-lg">How it works</h2>
                <ol className="text-white/60 text-sm flex flex-col gap-2 list-decimal list-inside">
                  <li>You get 5 real apartment matchups per day.</li>
                  <li>For each pair, pick which apartment you think offers better value.</li>
                  <li>After voting, see how the crowd voted.</li>
                  <li>You&apos;re right if you picked with the majority.</li>
                  <li>Come back daily to keep your streak alive.</li>
                </ol>
                <p className="text-white/30 text-xs">All listings are sourced from real rental markets.</p>
              </>
            )}
            {modal === 'about' && (
              <>
                <h2 className="text-white font-bold text-lg">About Rentle</h2>
                <p className="text-white/60 text-sm">
                  Rentle is a daily apartment value game. Every day, five real apartments go head to head. You vote on which is better value — then see if the crowd agrees.
                </p>
                <p className="text-white/60 text-sm">
                  Listings are sourced from real rental markets across the US and refreshed regularly.
                </p>
                <p className="text-white/30 text-xs">Built by rentle.lol</p>
              </>
            )}
            <button
              onClick={() => setModal(null)}
              className="mt-2 text-white/40 hover:text-white/70 text-sm transition-colors self-end"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function DisabledTile({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="rounded-2xl px-4 py-4 flex flex-col gap-3 bg-white/[0.03] border border-white/[0.07] opacity-55 select-none">
      <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center">
        <svg className="w-4 h-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          {icon}
        </svg>
      </div>
      <div>
        <p className="text-sm font-semibold text-white/40">{label}</p>
        <p className="text-xs text-white/20 mt-0.5">Coming soon</p>
      </div>
    </div>
  )
}
