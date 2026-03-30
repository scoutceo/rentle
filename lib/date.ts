const EASTERN_TIMEZONE = 'America/New_York'

export function getEasternDateKey(date = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: EASTERN_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  return formatter.format(date)
}

export function getDateOffsetInEastern(days: number, from = new Date()) {
  const copy = new Date(from)
  copy.setDate(copy.getDate() + days)
  return getEasternDateKey(copy)
}
