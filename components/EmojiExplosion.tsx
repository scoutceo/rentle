'use client'

import { useEffect, useRef, useState } from 'react'

type WinParticle = {
  id: number
  emoji: string
  tx: number
  ty: number
  size: number
  duration: number
  delay: number
  rotation: number
}

type LoseParticle = {
  id: number
  emoji: string
  direction: 'ltr' | 'rtl'
  y: number
  wave: number
  size: number
  duration: number
  delay: number
}

type Props = {
  correct: boolean
  trigger: boolean
}

const WIN_EMOJIS = ['🎉', '🏆', '✅', '🔥', '💰', '🎊', '💯', '🙌', '⭐', '🥇']
const LOSE_EMOJIS = ['😭', '😤', '💀', '😩', '🤦', '😢', '😫', '💸', '🤡', '😬']

export default function EmojiExplosion({ correct, trigger }: Props) {
  const [winParticles, setWinParticles] = useState<WinParticle[]>([])
  const [loseParticles, setLoseParticles] = useState<LoseParticle[]>([])
  const [flash, setFlash] = useState(false)
  const prevTriggerRef = useRef(false)

  useEffect(() => {
    if (!trigger || prevTriggerRef.current === trigger) {
      prevTriggerRef.current = trigger
      return
    }

    prevTriggerRef.current = trigger

    const flashTimeouts: ReturnType<typeof setTimeout>[] = []

    if (correct) {
      const count = 60 + Math.floor(Math.random() * 21)
      const particles: WinParticle[] = Array.from({ length: count }, (_, i) => {
        const angle = Math.random() * Math.PI * 2
        const distance = 120 + Math.random() * 220
        return {
          id: i,
          emoji: WIN_EMOJIS[Math.floor(Math.random() * WIN_EMOJIS.length)],
          tx: Math.cos(angle) * distance,
          ty: Math.sin(angle) * distance,
          size: 1.2 + Math.random() * 1.6,
          duration: 0.8 + Math.random() * 0.9,
          delay: Math.random() * 0.3,
          rotation: Math.random() * 720 - 360,
        }
      })

      const kickoff = setTimeout(() => {
        setWinParticles(particles)
        setFlash(true)
        flashTimeouts.push(setTimeout(() => setFlash(false), 220))
      }, 0)
      const cleanup = setTimeout(() => setWinParticles([]), 2500)
      flashTimeouts.push(kickoff, cleanup)
    } else {
      const count = 80 + Math.floor(Math.random() * 21)
      const particles: LoseParticle[] = Array.from({ length: count }, (_, i) => ({
        id: i,
        emoji: LOSE_EMOJIS[Math.floor(Math.random() * LOSE_EMOJIS.length)],
        direction: (Math.random() > 0.5 ? 'ltr' : 'rtl') as 'ltr' | 'rtl',
        y: 5 + Math.random() * 85,
        wave: Math.random() * 30 - 15,
        size: 1.4 + Math.random() * 1.4,
        duration: 1.2 + Math.random() * 1.3,
        delay: Math.random() * 1.0,
      }))

      const kickoff = setTimeout(() => setLoseParticles(particles), 0)
      const cleanup = setTimeout(() => setLoseParticles([]), 2500)
      flashTimeouts.push(kickoff, cleanup)
    }

    return () => {
      flashTimeouts.forEach(clearTimeout)
    }
  }, [trigger, correct])

  if (winParticles.length === 0 && loseParticles.length === 0 && !flash) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {flash && (
        <div
          className="absolute inset-0 animate-screen-flash"
          style={{ background: 'rgba(20, 184, 166, 0.4)' }}
        />
      )}

      {winParticles.map((p) => (
        <div
          key={p.id}
          className="absolute animate-confetti-burst"
          style={{
            left: '50%',
            top: '45%',
            fontSize: `${p.size}rem`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            '--tx': `${p.tx}px`,
            '--ty': `${p.ty}px`,
            '--rotation': `${p.rotation}deg`,
          } as React.CSSProperties}
        >
          {p.emoji}
        </div>
      ))}

      {loseParticles.map((p) => (
        <div
          key={p.id}
          className={`absolute ${p.direction === 'ltr' ? 'animate-flood-ltr' : 'animate-flood-rtl'}`}
          style={{
            left: p.direction === 'ltr' ? '0' : '100%',
            top: `${p.y}%`,
            fontSize: `${p.size}rem`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            '--wave': `${p.wave}px`,
          } as React.CSSProperties}
        >
          {p.emoji}
        </div>
      ))}
    </div>
  )
}
