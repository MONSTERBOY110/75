import type { AttendanceRecord, Holiday, Slot } from '../types'
import { daysBetween, formatDate, fromDateKey, toDateKey } from '../utils/date'
import { listOccurrences, recordKey, type Occurrence } from './attendance'

/** Guards against a typo turning a long weekend into a year off. */
export const MAX_HOLIDAY_DAYS = 120

/** The holiday covering a date, if any. Ranges are inclusive at both ends. */
export function holidayOn(dateKey: string, holidays: Holiday[]): Holiday | undefined {
  // "YYYY-MM-DD" strings sort in date order, so plain comparison is enough.
  return holidays.find((h) => h.from <= dateKey && dateKey <= h.to)
}

/**
 * The record set the rest of the app should count from, with holidays applied.
 *
 * Every routine class that falls on a holiday becomes "no class", overriding any
 * mark already made for it - a holiday means those classes did not run.
 * Substitution classes are left alone, so a makeup class held during a break
 * still counts. The marks produced here exist only in memory and carry the
 * holiday's name, so screens can say why a class is off.
 */
export function applyHolidays(
  occurrences: Occurrence[],
  records: AttendanceRecord[],
  holidays: Holiday[],
): AttendanceRecord[] {
  if (holidays.length === 0) return records

  const covered = new Set<string>()
  const virtual: AttendanceRecord[] = []

  for (const o of occurrences) {
    if (o.extra) continue
    const holiday = holidayOn(o.dateKey, holidays)
    if (!holiday) continue

    const key = recordKey(o.dateKey, o.slotId)
    covered.add(key)
    virtual.push({
      id: key,
      dateKey: o.dateKey,
      date: o.date,
      slotId: o.slotId,
      subjectId: o.subjectId,
      status: 'notHeld',
      holiday: holiday.name,
      createdAt: null,
      updatedAt: null,
    })
  }

  // Replace rather than append, so a lookup by date and slot finds the holiday.
  const kept = records.filter((r) => r.extra || !covered.has(recordKey(r.dateKey, r.slotId)))
  return [...kept, ...virtual]
}

/** Calendar days in a range, counting both ends. */
export function holidayDays(from: string, to: string): number {
  return daysBetween(fromDateKey(from), fromDateKey(to)) + 1
}

/** Everything wrong with a holiday before it is saved, in the order to fix it. */
export function validateHoliday(from: string, to: string): string[] {
  if (!from || !Number.isFinite(fromDateKey(from))) return ['Pick the date of the holiday.']
  if (!to || !Number.isFinite(fromDateKey(to))) return ['Pick the last day of the holiday.']
  if (to < from) return ['The last day cannot be before the first.']
  if (holidayDays(from, to) > MAX_HOLIDAY_DAYS) {
    return [`A holiday can be at most ${MAX_HOLIDAY_DAYS} days long.`]
  }
  return []
}

/**
 * How many routine classes a holiday would switch off - including ones still in
 * the future, which is what makes a vacation set in advance mean something.
 */
export function classesInRange(slots: Slot[], from: string, to: string): number {
  const start = fromDateKey(from)
  const end = fromDateKey(to)
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return 0
  // A moment before midnight, so every class on the last day is included.
  return listOccurrences(slots, start, end + 24 * 60 * 60 * 1000 - 1).length
}

/**
 * Marks already made for routine classes in the range that a holiday would
 * override - worth warning about, since they stop counting the moment it is added.
 */
export function marksOverridden(records: AttendanceRecord[], from: string, to: string): number {
  return records.filter(
    (r) =>
      !r.extra &&
      !r.holiday &&
      (r.status === 'attended' || r.status === 'absent') &&
      r.dateKey >= from &&
      r.dateKey <= to,
  ).length
}

/** "24 Oct 2026", or "20 Oct 2026 to 26 Oct 2026" for a range. */
export function formatHolidayRange(from: string, to: string): string {
  const a = formatDate(fromDateKey(from))
  return from === to ? a : `${a} to ${formatDate(fromDateKey(to))}`
}

/** Today's date key, for defaulting the form. */
export function todayKey(nowMs: number = Date.now()): string {
  return toDateKey(nowMs)
}
