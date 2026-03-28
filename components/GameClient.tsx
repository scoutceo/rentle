'use client'

import { useState, useEffect } from 'react'
import ApartmentCard from './ApartmentCard'
import ShareButton from './ShareButton'
import { PairWithApartments } from '@/lib/supabase'
import { getStoredVote, storeVote, getStreak, updateStreak } from '@/lib/localStorage'

type Props = {
  pair: PairWithApartments
}

export default function GameClient({ pair }: Props) {
  const [votesA, setVotesA] = useState(pair.votes_a)
  const [votesB, setVotesB] = useState(pair.votes_b)
  const [choice, setChoice] = useState<'A' | 'B' | null>(null)
  const [voting, setVoting] = useState(false)
  const [streak, setStreak] = useState(0)

  const total = votesA + votesB
  const percentA = total > 0 ? Math.round((votesA / total) * 100) : 50
  const percentB = total > 0 ? Math.round((votesB / total) * 100) : 50
  const winner = votesA >= votesB ? 'A' : 'B'
  const correct = choice !== null ? choice === winner : null

  useEffect(() => {
    const stored = getStoredVote(pair.date)
    if (stored) {
      setChoice(stored.choice)
      setVotesA(stored.votes_a)
      setVotesB(stored.votes_b)
    }
    setStreak(getStreak())
  }, [pair.date])

  const handleVote = async (side: 'A' | 'B') => {
    if (choice || voting) return
    setVoting(true)

    try {
      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pair_id: pair.id, choice: side }),
      })
      const data = await res.json()

      const newVotesA = data.votes_a
      const newVotesB = data.votes_b
      const newWinner = newVotesA >= newVotesB ? 'A' : 'B'
      const isCorrect = side === newWinner

      setVotesA(newVotesA)
      setVotesB(newVotesB)
      setChoice(side)

      const newStreak = updateStreak(pair.date, isCorrect)
      setStreak(newStreak)

      storeVote(pair.date, {
        choice: side,
        winner: newWinner,
        correct: isCorrect,
        votes_a: newVotesA,
        votes_b: newVotesB,
      })
    } catch (err) {
      console.error(err)
    } finally {
      setVoting(false)
    }
  }

  const voted = choice !== null

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Cards grid */}
      <div className="relative w-full grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-center">
        <ApartmentCard
          apartment={pair.apartment_a}
          side="A"
          voted={voted}
          chosen={choice === 'A'}
          correct={choice === 'A' ? correct : null}
          votePercent={voted ? percentA : null}
          onVote={() => handleVote('A')}
          disabled={voted || voting}
        />

        {/* VS Badge */}
        <div className="flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center
            text-white/60 font-bold text-sm shrink-0">
            VS
          </div>
        </div>

        <ApartmentCard
          apartment={pair.apartment_b}
          side="B"
          voted={voted}
          chosen={choice === 'B'}
          correct={choice === 'B' ? correct : null}
          votePercent={voted ? percentB : null}
          onVote={() => handleVote('B')}
          disabled={voted || voting}
        />
      </div>

      {/* Post-vote message */}
      {voted && (
        <div className="flex flex-col items-center gap-4 text-center animate-fade-in">
          <div className="flex flex-col items-center gap-1">
            <p className="text-2xl font-bold text-white">
              {correct ? 'You nailed it! 🎉' : 'Tough break 😅'}
            </p>
            <p className="text-white/50 text-sm">
              {correct
                ? `${winner === 'A' ? percentA : percentB}% of voters agreed with you`
                : `${winner === 'A' ? percentA : percentB}% picked the other apartment`}
            </p>
          </div>

          <p className="text-white/40 text-sm">Come back tomorrow for a new pair!</p>

          <ShareButton
            date={pair.date}
            streak={streak}
            correct={correct!}
            choice={choice!}
            winner={winner}
          />
        </div>
      )}
    </div>
  )
}
