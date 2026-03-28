'use client'

import { useState } from 'react'

type Props = {
  date: string
  streak: number
  correct: boolean
  choice: 'A' | 'B'
  winner: 'A' | 'B'
}

export default function ShareButton({ date, streak, correct, choice, winner }: Props) {
  const [copied, setCopied] = useState(false)

  const buildShareText = () => {
    const emoji = correct ? '✅' : '❌'
    const aSquare = winner === 'A' ? '🟩' : '⬜'
    const bSquare = winner === 'B' ? '🟩' : '⬜'
    const choiceSquares = choice === 'A'
      ? `${aSquare}⬜`
      : `⬜${bSquare}`
    return `Rentle ${date} ${emoji} ${streak}/streak\n${choiceSquares}\nrentle.app`
  }

  const handleShare = async () => {
    const text = buildShareText()
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          Share Result
        </>
      )}
    </button>
  )
}
