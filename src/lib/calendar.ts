import type { AttendanceRecord } from '../types'
import { addDays, isoWeekday, startOfDay, toDateKey } from '../utils/date'
import { aggregate, statsFor, type Occurrence, type Totals } from './attendance'

export interface CalendarDay {
  /** Local midnight ms. */
  date: number
  dateKey: string
  /** Day of the month, 1-31. */
  day: number
  /** False for the leading and trailing days borrowed from the next or previous month. */
  inMonth: boolean
  isToday: boolean
}

/**
 * What a week has to show.
 *  - `held`: at least one class was held, so there is a percentage.
 *  - `noClasses`: classes were scheduled but every one was marked "no class".
 *  - `none`: nothing to report - before the semester, in the future, or no routine.
 */
export type WeekState = 'held' | 'noClasses' | 'none'

export interface CalendarWeek {
  /** Local midnight ms of the Sunday that opens the row. */
  start: number
  days: CalendarDay[]
  totals: Totals
  state: WeekState
}

/** Rows always shown, so switching months never makes the page jump. */
export const CALENDAR_ROWS = 6

/**
 * The Sunday on or before a date. The calendar is laid out Sunday-first, like a
 * normal wall calendar, and each row's percentage covers exactly the seven days
 * in that row - so a substitution class on a Sunday counts in the row it sits in.
 */
export function weekStartOf(value: number): number {
  const day = startOfDay(value)
  return addDays(day, -(isoWeekday(day) % 7))
}

/**
 * Attendance for one Sunday-to-Saturday calendar row.
 *
 * Uses exactly the same counting as every other figure in the app - it is the
 * overall number, just narrowed to seven days - so a week can never disagree
 * with the subject totals it is made of. A week that straddles two months is
 * still counted whole: the percentage belongs to the week, not to the month
 * being looked at.
 */
export function weekTotals(
  occurrences: Occurrence[],
  records: AttendanceRecord[],
  weekStart: number,
): Totals {
  const end = addDays(weekStart, 7)
  const inWeek = occurrences.filter((o) => o.date >= weekStart && o.date < end)
  return aggregate([...statsFor(inWeek, records).values()])
}

function stateOf(totals: Totals): WeekState {
  if (totals.held > 0) return 'held'
  if (totals.scheduled > 0) return 'noClasses'
  return 'none'
}

/**
 * The rows of a month view: always six whole weeks starting from the Sunday on or
 * before the 1st, borrowing days from the neighbouring months as a wall calendar
 * does, each row carrying its own attendance.
 *
 * `month` is 0-based, like `Date`. Occurrences are expected to be the student's
 * full set - routine and substitution classes, already limited to the semester
 * and to classes that have started - which is what `useStats` provides.
 */
export function monthGrid(
  year: number,
  month: number,
  occurrences: Occurrence[],
  records: AttendanceRecord[],
  nowMs: number,
): CalendarWeek[] {
  const first = startOfDay(new Date(year, month, 1))
  const today = startOfDay(nowMs)

  const weeks: CalendarWeek[] = []
  for (let row = 0, start = weekStartOf(first); row < CALENDAR_ROWS; row++, start = addDays(start, 7)) {
    const days: CalendarDay[] = Array.from({ length: 7 }, (_, i) => {
      const date = addDays(start, i)
      const d = new Date(date)
      return {
        date,
        dateKey: toDateKey(date),
        day: d.getDate(),
        inMonth: d.getMonth() === month && d.getFullYear() === year,
        isToday: date === today,
      }
    })

    const totals = weekTotals(occurrences, records, start)
    weeks.push({ start, days, totals, state: stateOf(totals) })
  }
  return weeks
}

/** A comparable index for a year and 0-based month: later months sort higher. */
export function monthIndex(year: number, month: number): number {
  return year * 12 + month
}

/** Steps a year/month pair by `delta` months, carrying across year boundaries. */
export function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const index = monthIndex(year, month) + delta
  return { year: Math.floor(index / 12), month: ((index % 12) + 12) % 12 }
}
