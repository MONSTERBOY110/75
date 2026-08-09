import type { AttendanceRecord, Slot } from '../types'
import { addDays, isoWeekday, minutesOfDay, minutesSinceMidnight, startOfDay, toDateKey } from '../utils/date'

/** The attendance line every college draws. */
export const TARGET = 0.75

/** Refuse to walk more than this many days - guards against a bogus start date. */
const MAX_DAYS = 400

export type Band = 'safe' | 'warn' | 'danger' | 'empty'

/** One scheduled class on one concrete date. */
export interface Occurrence {
  dateKey: string
  /** Local midnight ms of `dateKey`. */
  date: number
  slotId: string
  subjectId: string
  start: string
  end: string
}

export interface Totals {
  /** Classes the routine put on the calendar in the window. */
  scheduled: number
  /** Of those, the ones you marked as never held. */
  notHeld: number
  /** scheduled − notHeld. This is the Y in "X of Y". */
  held: number
  /** The X. */
  attended: number
  absent: number
  /** Held classes you never marked either way - these count against you. */
  unmarked: number
  /** 0-100. */
  percent: number
  /** How many more you can miss and still land on or above TARGET. */
  canSkip: number
  /** How many in a row you must attend to climb back to TARGET. */
  mustAttend: number
}

export type SubjectStat = Totals & { subjectId: string }

export type LogStatus = 'attended' | 'absent' | 'notHeld' | 'unmarked'

export interface LogEntry extends Occurrence {
  status: LogStatus
}

const EMPTY_TOTALS: Totals = {
  scheduled: 0,
  notHeld: 0,
  held: 0,
  attended: 0,
  absent: 0,
  unmarked: 0,
  percent: 0,
  canSkip: 0,
  mustAttend: 0,
}

/** The Firestore document id for a mark. Deterministic, so writes are idempotent. */
export function recordKey(dateKey: string, slotId: string): string {
  return `${dateKey}__${slotId}`
}

/**
 * Every class the routine scheduled between the semester start and now.
 *
 * A class on today's date only counts once its start time has passed - a 2pm
 * lab shouldn't drag your percentage down at 9am.
 */
export function listOccurrences(slots: Slot[], semesterStartMs: number, nowMs: number): Occurrence[] {
  if (!slots.length || !Number.isFinite(semesterStartMs) || !Number.isFinite(nowMs)) return []

  const firstDay = startOfDay(semesterStartMs)
  const today = startOfDay(nowMs)
  if (firstDay > today) return []

  // Bucket the routine by weekday once, so the day walk stays cheap.
  const byWeekday = new Map<number, Slot[]>()
  for (const slot of slots) {
    const bucket = byWeekday.get(slot.day)
    if (bucket) bucket.push(slot)
    else byWeekday.set(slot.day, [slot])
  }
  for (const bucket of byWeekday.values()) {
    bucket.sort((a, b) => minutesOfDay(a.start) - minutesOfDay(b.start))
  }

  const nowMinutes = minutesSinceMidnight(nowMs)
  const occurrences: Occurrence[] = []

  let day = firstDay
  for (let i = 0; day <= today && i <= MAX_DAYS; i++, day = addDays(day, 1)) {
    const daySlots = byWeekday.get(isoWeekday(day))
    if (!daySlots) continue

    const isToday = day === today
    const dateKey = toDateKey(day)

    for (const slot of daySlots) {
      if (isToday && minutesOfDay(slot.start) > nowMinutes) continue
      occurrences.push({
        dateKey,
        date: day,
        slotId: slot.id,
        subjectId: slot.subjectId,
        start: slot.start,
        end: slot.end,
      })
    }
  }

  return occurrences
}

/** Indexes records by their `dateKey__slotId` key. */
function indexRecords(records: AttendanceRecord[]): Map<string, AttendanceRecord> {
  const map = new Map<string, AttendanceRecord>()
  for (const record of records) {
    map.set(recordKey(record.dateKey, record.slotId), record)
  }
  return map
}

/**
 * Per-subject totals over a set of occurrences.
 *
 * Records outside the occurrence set are ignored, so a stale mark (a routine
 * that changed, a date before the semester start) can never inflate a total.
 */
export function statsFor(
  occurrences: Occurrence[],
  records: AttendanceRecord[],
): Map<string, SubjectStat> {
  const marks = indexRecords(records)
  const stats = new Map<string, SubjectStat>()

  for (const occurrence of occurrences) {
    let stat = stats.get(occurrence.subjectId)
    if (!stat) {
      stat = { ...EMPTY_TOTALS, subjectId: occurrence.subjectId }
      stats.set(occurrence.subjectId, stat)
    }

    stat.scheduled++
    switch (marks.get(recordKey(occurrence.dateKey, occurrence.slotId))?.status) {
      case 'attended':
        stat.attended++
        break
      case 'absent':
        stat.absent++
        break
      case 'notHeld':
        stat.notHeld++
        break
      default:
        stat.unmarked++
    }
  }

  for (const stat of stats.values()) {
    finalize(stat)
  }
  return stats
}

/** Rolls several subjects into one figure by summing counts, never percentages. */
export function aggregate(stats: SubjectStat[]): Totals {
  const total: Totals = { ...EMPTY_TOTALS }
  for (const stat of stats) {
    total.scheduled += stat.scheduled
    total.notHeld += stat.notHeld
    total.attended += stat.attended
    total.absent += stat.absent
    total.unmarked += stat.unmarked
  }
  return finalize(total)
}

/** Derives held / percent / advice from the raw counts. Mutates and returns. */
function finalize<T extends Totals>(totals: T): T {
  totals.held = totals.scheduled - totals.notHeld
  // Rounded to 2dp so the number we display and the number `band()` judges are
  // the same one - and so 55/100 doesn't surface as 55.00000000000001.
  totals.percent =
    totals.held > 0 ? Math.round((totals.attended / totals.held) * 10_000) / 100 : 0

  // Skip n more and you sit at attended / (held + n) - solve for the largest n
  // that keeps that at or above TARGET.
  totals.canSkip = Math.max(0, Math.floor(totals.attended / TARGET) - totals.held)

  // Attend n more in a row and you sit at (attended + n) / (held + n).
  totals.mustAttend =
    totals.held > 0 && totals.percent < TARGET * 100
      ? Math.max(0, Math.ceil((TARGET * totals.held - totals.attended) / (1 - TARGET)))
      : 0

  return totals
}

export function band(percent: number, held: number): Band {
  if (held <= 0) return 'empty'
  if (percent >= 75) return 'safe'
  if (percent >= 65) return 'warn'
  return 'danger'
}

/** A subject's dated history, newest first, with gaps surfaced as 'unmarked'. */
export function buildLog(occurrences: Occurrence[], records: AttendanceRecord[]): LogEntry[] {
  const marks = indexRecords(records)
  return occurrences
    .map((occurrence): LogEntry => ({
      ...occurrence,
      status: marks.get(recordKey(occurrence.dateKey, occurrence.slotId))?.status ?? 'unmarked',
    }))
    .sort((a, b) => b.date - a.date || a.start.localeCompare(b.start))
}
