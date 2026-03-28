const VOTES_KEY = 'rentle_votes'
const STREAK_KEY = 'rentle_streak'
const LAST_PLAYED_KEY = 'rentle_last_played'
const GAME_STATE_KEY = 'rentle_game'

export type StoredVote = {
  choice: 'A' | 'B'
  winner: 'A' | 'B'
  correct: boolean
  votes_a: number
  votes_b: number
}

export type RoundResult = {
  pair_id: string
  choice: 'A' | 'B'
  correct: boolean
  votes_a: number
  votes_b: number
}

export type GameState = {
  rounds: RoundResult[]
  complete: boolean
}

export function getGameState(date: string): GameState | null {
  if (typeof window === 'undefined') return null
  try {
    const all = JSON.parse(localStorage.getItem(GAME_STATE_KEY) || '{}')
    return all[date] || null
  } catch {
    return null
  }
}

export function saveGameState(date: string, state: GameState): void {
  if (typeof window === 'undefined') return
  try {
    const all = JSON.parse(localStorage.getItem(GAME_STATE_KEY) || '{}')
    all[date] = state
    localStorage.setItem(GAME_STATE_KEY, JSON.stringify(all))
  } catch {
    // ignore
  }
}

export function getStoredVote(date: string): StoredVote | null {
  if (typeof window === 'undefined') return null
  try {
    const votes = JSON.parse(localStorage.getItem(VOTES_KEY) || '{}')
    return votes[date] || null
  } catch {
    return null
  }
}

export function storeVote(date: string, vote: StoredVote): void {
  if (typeof window === 'undefined') return
  try {
    const votes = JSON.parse(localStorage.getItem(VOTES_KEY) || '{}')
    votes[date] = vote
    localStorage.setItem(VOTES_KEY, JSON.stringify(votes))
  } catch {
    // ignore
  }
}

export function getStreak(): number {
  if (typeof window === 'undefined') return 0
  try {
    return parseInt(localStorage.getItem(STREAK_KEY) || '0', 10)
  } catch {
    return 0
  }
}

export function updateStreak(date: string, correct: boolean): number {
  if (typeof window === 'undefined') return 0
  try {
    const lastPlayed = localStorage.getItem(LAST_PLAYED_KEY)
    const today = date
    const yesterday = getPreviousDate(today)

    let streak = parseInt(localStorage.getItem(STREAK_KEY) || '0', 10)

    if (correct) {
      if (lastPlayed === yesterday || lastPlayed === null) {
        streak += 1
      } else if (lastPlayed !== today) {
        streak = 1
      }
    } else {
      if (lastPlayed !== today) {
        streak = 0
      }
    }

    localStorage.setItem(STREAK_KEY, String(streak))
    localStorage.setItem(LAST_PLAYED_KEY, today)
    return streak
  } catch {
    return 0
  }
}

function getPreviousDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().split('T')[0]
}
