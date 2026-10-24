import { describe, it, expect } from 'vitest'
import type { AttendanceRecord, AttendanceStatus, Holiday, Slot } from '../types'
import { extraOccurrences, listOccurrences, recordKey, statsFor } from './attendance'
import {
  applyHolidays,
  classesInRange,
  formatHolidayRange,
  holidayDays,
  holidayOn,
  marksOverridden,
  validateHoliday,
} from './holidays'
import { toDateKey } from '../utils/date'

// 3 Aug 2026 is a Monday.
const day = (d: number, h = 0) => new Date(2026, 7, d, h).getTime()
const START = day(3)

/** Three classes a week: two on Monday, one on Wednesday. */
const SLOTS: Slot[] = [
  { id: 'mon-1000', day: 1, start: '10:00', end: '11:00', subjectId: 'math' },
  { id: 'mon-1400', day: 1, start: '14:00', end: '15:00', subjectId: 'phys' },
  { id: 'wed-1000', day: 3, start: '10:00', end: '11:00', subjectId: 'math' },
]

const holiday = (from: string, to: string, name = 'Durga Puja'): Holiday => ({
  id: `${from}-${to}`,
  name,
  from,
  to,
  createdAt: null,
})

function mark(d: number, slotId: string, subjectId: string, status: AttendanceStatus): AttendanceRecord {
  const date = day(d)
  const dateKey = toDateKey(date)
  return { id: recordKey(dateKey, slotId), dateKey, date, slotId, subjectId, status, createdAt: null, updatedAt: null }
}

const extra = (d: number, status: AttendanceStatus): AttendanceRecord => ({
  ...mark(d, 'x-math', 'math', status),
  extra: true,
  start: '09:00',
  end: '10:00',
})

describe('holidayOn', () => {
  const list = [holiday('2026-08-10', '2026-08-14'), holiday('2026-08-20', '2026-08-20', 'Founders Day')]

  it('finds the holiday covering a date, including its first and last day', () => {
    expect(holidayOn('2026-08-10', list)?.name).toBe('Durga Puja')
    expect(holidayOn('2026-08-12', list)?.name).toBe('Durga Puja')
    expect(holidayOn('2026-08-14', list)?.name).toBe('Durga Puja')
  })

  it('handles a one-day holiday', () => {
    expect(holidayOn('2026-08-20', list)?.name).toBe('Founders Day')
  })

  it('returns nothing outside every holiday', () => {
    expect(holidayOn('2026-08-09', list)).toBeUndefined()
    expect(holidayOn('2026-08-15', list)).toBeUndefined()
  })
})

describe('applyHolidays', () => {
  const now = day(14, 23) // Fri 14 Aug, evening
  const occurrences = listOccurrences(SLOTS, START, now)

  it('changes nothing when there are no holidays', () => {
    const records = [mark(3, 'mon-1000', 'math', 'attended')]
    expect(applyHolidays(occurrences, records, [])).toBe(records)
  })

  it('turns every routine class in the holiday into "no class", named', () => {
    const out = applyHolidays(occurrences, [], [holiday('2026-08-10', '2026-08-14')])
    // Mon 10 Aug (2 classes) and Wed 12 Aug (1).
    expect(out).toHaveLength(3)
    expect(out.every((r) => r.status === 'notHeld' && r.holiday === 'Durga Puja')).toBe(true)
  })

  it('overrides a mark already made on a holiday', () => {
    const records = [mark(10, 'mon-1000', 'math', 'attended')]
    const out = applyHolidays(occurrences, records, [holiday('2026-08-10', '2026-08-10')])
    const forThatClass = out.filter((r) => r.dateKey === '2026-08-10' && r.slotId === 'mon-1000')
    // Replaced, not duplicated: one lookup by date and slot must find the holiday.
    expect(forThatClass).toHaveLength(1)
    expect(forThatClass[0]).toMatchObject({ status: 'notHeld', holiday: 'Durga Puja' })
  })

  it('leaves classes outside the holiday alone', () => {
    const records = [mark(3, 'mon-1000', 'math', 'attended')]
    const out = applyHolidays(occurrences, records, [holiday('2026-08-10', '2026-08-14')])
    expect(out).toContainEqual(records[0])
  })

  it('still counts a substitution class held during a holiday', () => {
    const records = [extra(11, 'attended')]
    const all = [...occurrences, ...extraOccurrences(records, START, now)]
    const out = applyHolidays(all, records, [holiday('2026-08-10', '2026-08-14')])
    expect(out).toContainEqual(records[0])
    expect(out.find((r) => r.extra)?.holiday).toBeUndefined()
  })

  it('takes holiday classes out of the total rather than counting them against you', () => {
    // Week 2 entirely on holiday; week 1 attended in full.
    const records = [
      mark(3, 'mon-1000', 'math', 'attended'),
      mark(3, 'mon-1400', 'phys', 'attended'),
      mark(5, 'wed-1000', 'math', 'attended'),
    ]
    // Math runs Mon 3, Wed 5, Mon 10, Wed 12. Without the holiday the second
    // week sits unmarked and drags the subject down to half.
    const before = statsFor(occurrences, records).get('math')!
    expect(before).toMatchObject({ held: 4, attended: 2, unmarked: 2, percent: 50 })

    const applied = applyHolidays(occurrences, records, [holiday('2026-08-10', '2026-08-14')])
    const after = statsFor(occurrences, applied).get('math')!
    expect(after).toMatchObject({ scheduled: 4, notHeld: 2, held: 2, attended: 2, unmarked: 0, percent: 100 })
  })
})

describe('validateHoliday', () => {
  it('accepts a single day', () => {
    expect(validateHoliday('2026-10-20', '2026-10-20')).toEqual([])
  })

  it('accepts a range', () => {
    expect(validateHoliday('2026-10-20', '2026-10-31')).toEqual([])
  })

  it('refuses a range that ends before it starts', () => {
    expect(validateHoliday('2026-10-20', '2026-10-19')).toEqual([
      'The last day cannot be before the first.',
    ])
  })

  it('refuses an implausibly long holiday', () => {
    expect(validateHoliday('2026-01-01', '2026-12-31')[0]).toContain('at most 120 days')
  })

  it('asks for a date when there is none', () => {
    expect(validateHoliday('', '')).toEqual(['Pick the date of the holiday.'])
  })
})

describe('range helpers', () => {
  it('counts calendar days inclusively', () => {
    expect(holidayDays('2026-08-10', '2026-08-10')).toBe(1)
    expect(holidayDays('2026-08-10', '2026-08-16')).toBe(7)
  })

  it('counts the routine classes a holiday would switch off', () => {
    expect(classesInRange(SLOTS, '2026-08-10', '2026-08-16')).toBe(3)
    // A day with nothing scheduled.
    expect(classesInRange(SLOTS, '2026-08-11', '2026-08-11')).toBe(0)
  })

  it('counts future classes too, so a vacation can be set in advance', () => {
    // Two whole weeks well after "now" in every other test.
    expect(classesInRange(SLOTS, '2026-12-07', '2026-12-20')).toBe(6)
  })

  it('warns only about real attended or absent marks in the range', () => {
    const records = [
      mark(10, 'mon-1000', 'math', 'attended'), // counts
      mark(10, 'mon-1400', 'phys', 'absent'), // counts
      mark(12, 'wed-1000', 'math', 'notHeld'), // already off: no change
      extra(11, 'attended'), // substitutions survive holidays
      mark(3, 'mon-1000', 'math', 'attended'), // outside the range
    ]
    expect(marksOverridden(records, '2026-08-10', '2026-08-14')).toBe(2)
  })

  it('formats one day and a range, without dashes', () => {
    expect(formatHolidayRange('2026-10-20', '2026-10-20')).toBe('20 Oct 2026')
    const range = formatHolidayRange('2026-10-20', '2026-10-26')
    expect(range).toBe('20 Oct 2026 to 26 Oct 2026')
    expect(range).not.toMatch(/[–—]/)
  })
})
