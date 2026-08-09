/**
 * Date helpers. Everything here works in LOCAL time on purpose - a class on
 * "Wednesday" is Wednesday where the student is sitting, so `toISOString()`
 * (which is UTC) must never be used to derive a date key.
 */

const DAY_MS = 24 * 60 * 60 * 1000

export const WEEKDAY_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as const
export const WEEKDAY_LONG = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** Local midnight of the day containing `value`, as ms since epoch. */
export function startOfDay(value: number | Date): number {
  const d = new Date(value)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/** ISO weekday of a local date: Monday = 1 … Sunday = 7. */
export function isoWeekday(value: number | Date): number {
  const day = new Date(value).getDay() // 0 = Sunday
  return day === 0 ? 7 : day
}

/** "YYYY-MM-DD" for the local date containing `value`. */
export function toDateKey(value: number | Date): string {
  const d = new Date(value)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

/** Local midnight ms for a "YYYY-MM-DD" key. Returns NaN for a malformed key. */
export function fromDateKey(key: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key)
  if (!match) return NaN
  const [, y, m, d] = match
  return new Date(Number(y), Number(m) - 1, Number(d)).getTime()
}

/**
 * Adds `n` calendar days to a local-midnight timestamp, staying at local
 * midnight across DST transitions (where a day is 23 or 25 hours long).
 */
export function addDays(value: number, n: number): number {
  const d = new Date(value)
  d.setDate(d.getDate() + n)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/** Whole calendar days between two local-midnight timestamps (DST-safe). */
export function daysBetween(fromMs: number, toMs: number): number {
  return Math.round((startOfDay(toMs) - startOfDay(fromMs)) / DAY_MS)
}

/** Minutes past local midnight for a "HH:MM" string. */
export function minutesOfDay(time: string): number {
  const [h, m] = time.split(':')
  return Number(h) * 60 + Number(m)
}

/** Minutes past local midnight for a timestamp. */
export function minutesSinceMidnight(value: number | Date): number {
  const d = new Date(value)
  return d.getHours() * 60 + d.getMinutes()
}

/** "9 Aug 2026" */
export function formatDate(value: number | Date): string {
  const d = new Date(value)
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

/** "WED · 9 Aug" - the compact header form. */
export function formatDayAndDate(value: number | Date): string {
  const d = new Date(value)
  return `${WEEKDAY_LABELS[isoWeekday(d) - 1]} · ${d.getDate()} ${MONTHS[d.getMonth()]}`
}

/** "10:00" -> "10:00 AM" */
export function formatTime(time: string): string {
  const [rawH, m] = time.split(':')
  const h = Number(rawH)
  const suffix = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return `${hour12}:${m} ${suffix}`
}

/** Value for an <input type="date">, which always wants "YYYY-MM-DD". */
export function toDateInputValue(value: number | Date): string {
  return toDateKey(value)
}
