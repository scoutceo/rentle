'use client'

import { useState, useEffect, useCallback } from 'react'
import ApartmentCard from './ApartmentCard'
import EmojiExplosion from './EmojiExplosion'
import { PairWithApartments } from '@/lib/supabase'
import {
  getGameState,
  saveGameState,
  getStreak,
  updateStreak,
  getOrCreateUserId,
  syncStateToSupabase,
  loadStateFromSupabase,
  RoundResult,
} from '@/lib/localStorage'

type Props = {
  pairs: PairWithApartments[]
  date: string
}

type Phase = 'voting' | 'reveal' | 'complete'

type RevealState = {
  votesA: number
  votesB: number
  percentA: number
  percentB: number
  winner: 'A' | 'B'
  choice: 'A' | 'B'
  correct: boolean
}

export default function GameClient({ pairs, date }: Props) {
  const totalRounds = pairs.length

  const [currentRound, setCurrentRound] = useState(0)
  const [results, setResults] = useState<RoundResult[]>([])
  const [phase, setPhase] = useState<Phase>('voting')
  const [revealState, setRevealState] = useState<RevealState | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [streak, setStreak] = useState(0)
  const [explosion, setExplosion] = useState<{ trigger: boolean; correct: boolean }>({ trigger: false, correct: false })

  useEffect(() => {
    const localSaved = getGameState(date)
    const localStreak = getStreak()

    const userId = getOrCreateUserId()
    loadStateFromSupabase(userId, date).then((remote) => {
      // Use remote state if it is more complete than local
      const useRemote =
        remote !== null &&
        (remote.complete ||
          remote.rounds.length > (localSaved?.rounds.length ?? 0))

      const saved = useRemote ? remote : localSaved

      if (saved) {
        setResults(saved.rounds)
        if (saved.complete) {
          setPhase('complete')
        } else {
          setCurrentRound(saved.rounds.length)
        }
        if (useRemote) {
          setStreak(remote!.streak)
          return
        }
      }
      setStreak(localStreak)
    }).catch(() => {
      if (localSaved) {
        setResults(localSaved.rounds)
        if (localSaved.complete) {
          setPhase('complete')
        } else {
          setCurrentRound(localSaved.rounds.length)
        }
      }
      setStreak(localStreak)
    })
  }, [date])

  const handleVote = useCallback(
    async (side: 'A' | 'B') => {
      if (submitting || phase !== 'voting') return
      setSubmitting(true)

      const pair = pairs[currentRound]

      try {
        const res = await fetch('/api/vote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pair_id: pair.id, choice: side, user_id: getOrCreateUserId() }),
        })
        const data = await res.json()

        const vA: number = data.votes_a
        const vB: number = data.votes_b
        const tot = vA + vB
        const pA = tot > 0 ? Math.round((vA / tot) * 100) : 50
        const pB = tot > 0 ? Math.round((vB / tot) * 100) : 50
        const winner: 'A' | 'B' = vA >= vB ? 'A' : 'B'
        const correct = side === winner

        const result: RoundResult = {
          pair_id: pair.id,
          choice: side,
          correct,
          votes_a: vA,
          votes_b: vB,
        }

        const newResults = [...results, result]
        setResults(newResults)

        const reveal: RevealState = {
          votesA: vA,
          votesB: vB,
          percentA: pA,
          percentB: pB,
          winner,
          choice: side,
          correct,
        }
        setRevealState(reveal)
        setPhase('reveal')
        setExplosion({ trigger: true, correct })

        const isLastRound = currentRound === totalRounds - 1
        saveGameState(date, { rounds: newResults, complete: isLastRound })

        const userId = getOrCreateUserId()

        setTimeout(() => {
          if (isLastRound) {
            const anyCorrect = newResults.some((r) => r.correct)
            const newStreak = updateStreak(date, anyCorrect)
            setStreak(newStreak)
            setPhase('complete')
            // Sync final complete state in background
            syncStateToSupabase(userId, date, { rounds: newResults, complete: true }, newStreak, date)
          } else {
            // Sync in-progress state in background
            syncStateToSupabase(userId, date, { rounds: newResults, complete: false }, getStreak(), date)
            setCurrentRound((prev) => prev + 1)
            setRevealState(null)
            setPhase('voting')
          }
        }, 2000)
      } catch (err) {
        console.error(err)
      } finally {
        setSubmitting(false)
      }
    },
    [submitting, phase, pairs, currentRound, results, totalRounds, date]
  )

  if (phase === 'complete') {
    return <ScoreScreen results={results} pairs={pairs} date={date} streak={streak} />
  }

  const pair = pairs[currentRound]
  const voted = phase === 'reveal'

  const vA = revealState?.votesA ?? pair.votes_a
  const vB = revealState?.votesB ?? pair.votes_b
  const tot = vA + vB
  const percentA = tot > 0 ? Math.round((vA / tot) * 100) : 50
  const percentB = 100 - percentA
  const winner: 'A' | 'B' = vA >= vB ? 'A' : 'B'
  const choice = revealState?.choice ?? null
  const correct = choice !== null ? choice === winner : null

  return (
    <div className="flex flex-col items-center gap-6">
      <EmojiExplosion correct={explosion.correct} trigger={explosion.trigger} />
      {/* Round progress */}
      <div className="flex flex-col items-center gap-2">
        <p className="text-white/50 text-sm font-medium">
          Round {currentRound + 1} of {totalRounds}
        </p>
        <div className="flex items-center gap-1.5">
          {pairs.map((_, i) => {
            const isPast = i < results.length
            const isCurrent = i === currentRound
            const pastResult = isPast ? results[i] : null
            return (
              <div
                key={i}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  isPast && pastResult?.correct
                    ? 'bg-teal-400'
                    : isPast && !pastResult?.correct
                    ? 'bg-red-500'
                    : isCurrent
                    ? 'bg-white'
                    : 'bg-white/20'
                }`}
              />
            )
          })}
        </div>
      </div>

      {/* Cards grid */}
      <div className="relative w-full grid grid-cols-1 items-center gap-4 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:gap-5">
        <ApartmentCard
          key={pair.apartment_a.id}
          apartment={pair.apartment_a}
          voted={voted}
          chosen={choice === 'A'}
          correct={choice === 'A' ? correct : null}
          votePercent={voted ? percentA : null}
          onVote={() => handleVote('A')}
          disabled={voted || submitting}
        />

        {/* VS Badge */}
        <div className="flex items-center justify-center">
          <div
            className="h-11 w-11 shrink-0 rounded-full border border-white/20 bg-white/10 text-white/60 font-bold text-sm flex items-center justify-center shadow-[0_8px_24px_rgba(0,0,0,0.25)]"
          >
            VS
          </div>
        </div>

        <ApartmentCard
          key={pair.apartment_b.id}
          apartment={pair.apartment_b}
          voted={voted}
          chosen={choice === 'B'}
          correct={choice === 'B' ? correct : null}
          votePercent={voted ? percentB : null}
          onVote={() => handleVote('B')}
          disabled={voted || submitting}
        />
      </div>

      {/* Reveal message */}
      {phase === 'reveal' && revealState && (
        <div className="flex flex-col items-center gap-1 text-center">
          <p className={`text-xl font-bold text-white ${revealState.correct ? 'animate-reveal-win' : 'animate-reveal-lose'}`}>
            {revealState.correct ? 'Nice pick! 🎉' : 'Not quite 😅'}
          </p>
          <p className="text-white/40 text-sm animate-fade-in">
            {currentRound < totalRounds - 1 ? 'Next round in a moment…' : 'Wrapping up…'}
          </p>
        </div>
      )}
    </div>
  )
}

type ScoreScreenProps = {
  results: RoundResult[]
  pairs: PairWithApartments[]
  date: string
  streak: number
}

function ScoreScreen({ results, pairs, date, streak }: ScoreScreenProps) {
  const score = results.filter((r) => r.correct).length
  const total = results.length

  return (
    <div className="flex flex-col items-center gap-8 py-4 w-full max-w-lg mx-auto">
      {/* Big score */}
      <div className="flex flex-col items-center gap-2">
        <p className="text-7xl font-black text-white tracking-tight">
          {score}
          <span className="text-white/30 text-5xl"> / {total}</span>
        </p>
        <p className="text-white/50 text-sm">
          {score === total
            ? 'Perfect score! 🏆'
            : score >= Math.ceil(total / 2)
            ? 'Nice work!'
            : 'Better luck tomorrow!'}
        </p>
        {streak > 0 && (
          <p className="text-teal-400 text-sm font-medium">🔥 {streak} day streak</p>
        )}
      </div>

      {/* Round rows */}
      <div className="w-full flex flex-col gap-2">
        {results.map((result, i) => {
          const pair = pairs[i]
          const winner: 'A' | 'B' =
            result.votes_a >= result.votes_b ? 'A' : 'B'
          const chosenApt =
            result.choice === 'A' ? pair.apartment_a : pair.apartment_b
          const otherApt =
            result.choice === 'A' ? pair.apartment_b : pair.apartment_a

          return (
            <div
              key={i}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/8"
            >
              <span className="text-lg shrink-0">{result.correct ? '✅' : '❌'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">
                  {chosenApt.neighborhood} · ${chosenApt.rent_monthly.toLocaleString()}
                </p>
                <p className="text-white/40 text-xs truncate">
                  vs {otherApt.neighborhood} · ${otherApt.rent_monthly.toLocaleString()}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-white/50 text-xs">
                  {winner === result.choice ? 'majority pick' : 'crowd disagreed'}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Share + CTA */}
      <div className="flex flex-col items-center gap-3">
        <ShareButton date={date} results={results} score={score} total={total} streak={streak} />
        <p className="text-white/30 text-sm">See you tomorrow!</p>
      </div>
    </div>
  )
}

type ShareProps = {
  date: string
  results: RoundResult[]
  score: number
  total: number
  streak: number
}

function ShareButton({ date, results, score, total, streak }: ShareProps) {
  const [copied, setCopied] = useState(false)

  const buildShareText = () => {
    const scoreEmoji = score === total ? '✅' : score >= Math.ceil(total / 2) ? '🏠' : '😅'
    const roundEmojis = results.map((r) => (r.correct ? '✅' : '❌')).join(' ')
    const streakLine = streak > 0 ? `\n🔥 ${streak} day streak` : ''
    return `Rentle ${date} 🏠\n${score}/${total} ${scoreEmoji}${streakLine}\n${roundEmojis}\nPlay at rentle.lol`
  }

  const handleShare = async () => {
    const text = buildShareText()
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15
        border border-white/10 text-white text-sm font-medium transition-all duration-200 active:scale-[0.98]"
    >
      {copied ? (
        <>
          <svg className="w-4 h-4 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Copied!
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
            />
          </svg>
          Share Result
        </>
      )}
    </button>
  )
}
