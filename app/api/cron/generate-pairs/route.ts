import { NextRequest, NextResponse } from 'next/server'
import { generateMissingDailyPairs, getEasternDateKey, getEasternHour } from '@/lib/daily-pairs'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const expected = process.env.CRON_SECRET || 'rentle-cron-2026'

  if (authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Unauthorized', hint: expected.substring(0, 4) }, { status: 401 })
  }

  const now = new Date()
  const easternHour = getEasternHour(now)

  if (easternHour !== 0) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: 'Not midnight in America/New_York',
      easternDate: getEasternDateKey(now),
      easternHour,
    })
  }

  try {
    const result = await generateMissingDailyPairs(30)
    return NextResponse.json({
      ok: true,
      easternDate: getEasternDateKey(now),
      easternHour,
      ...result,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        easternDate: getEasternDateKey(now),
        easternHour,
      },
      { status: 500 }
    )
  }
}
