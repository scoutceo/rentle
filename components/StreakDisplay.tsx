'use client'

import { useState } from 'react'
import { getStreak } from '@/lib/localStorage'

export default function StreakDisplay() {
  const [streak] = useState(() => getStreak())

  return (
    <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1.5">
      <span className="text-base">🔥</span>
      <span className="text-white font-semibold text-sm">{streak}</span>
      <span className="text-white/40 text-xs">streak</span>
    </div>
  )
}
