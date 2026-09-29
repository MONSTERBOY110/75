import { describe, it, expect } from 'vitest'
import type { AttendanceRecord, AttendanceStatus, Slot } from '../types'
import { aggregate, extraOccurrences, listOccurrences, recordKey, statsFor } from './attendance'
import { CALENDAR_ROWS, monthGrid, shiftMonth, weekStartOf, weekTotals } from './calendar'
import { toDateKey } from '../utils/date'

// 3 Aug 2026 is a Monday.
const day = (m: number, d: number, h = 0) => new Date(2026, m, d, h).getTime()
const START = day(7, 3) // Mon 3 Aug 2026
const NOW = day(7, 19, 23) // Wed 19 Aug 2026, 23:00

/** Three classes a week: two on Monday, one on Wednesday. */
const SLOTS: Slot[] = [
  { id: 'mon-1000', day: 1, start: '10:00', end: '11:00', subjectId: 'math' },
  { id: 'mon-1400', day: 1, start: '14:00', end: '15:00', subjectId: 'phys' },
  { id: 'wed-1000', day: 3, start: '10:00', end: '11:00', subjectId: 'math' },
]

function mark(date: number, slotId: string, subjectId: string, status: AttendanceStatus): AttendanceRecord {
  const dateKey = toDateKey(date)
  return { id: recordKey(dateKey, slotId), dateKey, date, slotId, subjectId, status, createdAt: null, updatedAt: null }
}

const occurrences = listOccurrences(SLOTS, START, NOW)

describe('weekStartOf', () => {
  it('returns the Sunday itself for a Sunday', () => {
    expect(weekStartOf(day(7, 9, 15))).toBe(day(7, 9))
  })

  it('walks a weekday back to the Sunday that opens its row', () => {
    expect(weekStartOf(day(7, 3))).toBe(day(7, 2)) // Mon 3 Aug -> Sun 2 Aug
    expect(weekStartOf(day(7, 8))).toBe(day(7, 2)) // Sat 8 Aug -> Sun 2 Aug
  })
})

describe('monthGrid shape', () => {
  it('always shows six rows, so the page never jumps between months', () => {
    for (const [y, m] of [[2026, 7], [2026, 8], [2027, 1]]) {
      expect(monthGrid(y, m, [], [], NOW)).toHaveLength(CALENDAR_ROWS)
    }
  })

  it('lays September 2026 out exactly like a wall calendar', () => {
    // 1 Sep 2026 is a Tuesday: the grid opens on Sun 30 Aug and closes on Sat 10 Oct.
    const grid = monthGrid(2026, 8, [], [], NOW)
    expect(grid[0].days.map((d) => d.day)).toEqual([30, 31, 1, 2, 3, 4, 5])
    expect(grid[5].days.map((d) => d.day)).toEqual([4, 5, 6, 7, 8, 9, 10])
  })

  it('always lays out seven days starting on a Sunday', () => {
    for (const week of monthGrid(2026, 7, [], [], NOW)) {
      expect(week.days).toHaveLength(7)
      expect(new Date(week.days[0].date).getDay()).toBe(0)
    }
  })

  it('marks the borrowed days from neighbouring months', () => {
    const grid = monthGrid(2026, 8, [], [], NOW)
    expect(grid[0].days.map((d) => d.inMonth)).toEqual([false, false, true, true, true, true, true])
    expect(grid[4].days.map((d) => d.inMonth)).toEqual([true, true, true, true, false, false, false])
    expect(grid[5].days.every((d) => !d.inMonth)).toBe(true)
  })

  it('flags exactly one day as today', () => {
    const today = monthGrid(2026, 7, [], [], NOW).flatMap((w) => w.days).filter((d) => d.isToday)
    expect(today).toHaveLength(1)
    expect(today[0].dateKey).toBe('2026-08-19')
  })
})

describe('week attendance', () => {
  const grid = (records: AttendanceRecord[] = [], occ = occurrences) =>
    monthGrid(2026, 7, occ, records, NOW)

  it('works out the percentage for one week', () => {
    const records = [
      mark(day(7, 3), 'mon-1000', 'math', 'attended'),
      mark(day(7, 3), 'mon-1400', 'phys', 'absent'),
      mark(day(7, 5), 'wed-1000', 'math', 'attended'),
    ]
    const week = grid(records)[1] // Sun 2 - Sat 8 Aug
    expect(week.state).toBe('held')
    expect(week.totals).toMatchObject({ held: 3, attended: 2, absent: 1 })
    expect(week.totals.percent).toBeCloseTo(66.67, 2)
  })

  it('counts unmarked classes against the week, like everywhere else', () => {
    const week = grid()[2] // Sun 9 - Sat 15 Aug, nothing marked
    expect(week.state).toBe('held')
    expect(week.totals).toMatchObject({ held: 3, attended: 0, unmarked: 3, percent: 0 })
  })

  it('reports nothing before the semester started', () => {
    expect(grid()[0].state).toBe('none') // Sun 26 Jul - Sat 1 Aug
  })

  it('reports nothing for a week that has not happened yet', () => {
    expect(grid()[4].state).toBe('none') // Sun 23 - Sat 29 Aug
  })

  it('only counts classes that have started in the current week', () => {
    // At Wed 19 Aug 23:00 all three of that week's classes have begun.
    expect(grid()[3].totals.held).toBe(3)
    // At Mon 17 Aug 12:00 only the Monday morning class has.
    const early = listOccurrences(SLOTS, START, day(7, 17, 12))
    expect(monthGrid(2026, 7, early, [], day(7, 17, 12))[3].totals.held).toBe(1)
  })

  it('says so when every class that week was marked "no class"', () => {
    const records = [
      mark(day(7, 10), 'mon-1000', 'math', 'notHeld'),
      mark(day(7, 10), 'mon-1400', 'phys', 'notHeld'),
      mark(day(7, 12), 'wed-1000', 'math', 'notHeld'),
    ]
    const week = grid(records)[2]
    expect(week.state).toBe('noClasses')
    expect(week.totals).toMatchObject({ scheduled: 3, held: 0, percent: 0 })
  })

  it('includes substitution classes', () => {
    const extra = {
      ...mark(day(7, 4), 'x-math', 'math', 'attended'),
      extra: true,
      start: '09:00',
      end: '10:00',
    }
    const occ = [...occurrences, ...extraOccurrences([extra], START, NOW)]
    expect(grid([extra], occ)[1].totals).toMatchObject({ held: 4, attended: 1 })
  })

  it('counts a Sunday substitution in the row it sits in', () => {
    const sunday = {
      ...mark(day(7, 9), 'x-math', 'math', 'attended'),
      extra: true,
      start: '09:00',
      end: '10:00',
    }
    const occ = [...occurrences, ...extraOccurrences([sunday], START, NOW)]
    const rows = grid([sunday], occ)
    expect(rows[1].totals.held).toBe(3) // Sun 2 - Sat 8 Aug: untouched
    expect(rows[2].totals).toMatchObject({ held: 4, attended: 1 }) // Sun 9 - Sat 15 Aug
  })

  it('counts a week that straddles two months whole, whichever month is shown', () => {
    const now = day(8, 9, 23) // Wed 9 Sep
    const occ = listOccurrences(SLOTS, START, now)
    const inAugust = monthGrid(2026, 7, occ, [], now)[5] // Sun 30 Aug - Sat 5 Sep
    const inSeptember = monthGrid(2026, 8, occ, [], now)[0]
    expect(inAugust.start).toBe(inSeptember.start)
    expect(inAugust.totals).toEqual(inSeptember.totals)
    // Mon 31 Aug (2) plus Wed 2 Sep (1).
    expect(inAugust.totals.held).toBe(3)
  })

  it('never disagrees with the overall figure it is carved out of', () => {
    const records = [
      mark(day(7, 3), 'mon-1000', 'math', 'attended'),
      mark(day(7, 10), 'mon-1400', 'phys', 'notHeld'),
      mark(day(7, 12), 'wed-1000', 'math', 'absent'),
      mark(day(7, 17), 'mon-1000', 'math', 'attended'),
    ]
    const overall = aggregate([...statsFor(occurrences, records).values()])
    const weeks = [day(7, 2), day(7, 9), day(7, 16)].map((w) => weekTotals(occurrences, records, w))

    const sum = (key: 'held' | 'attended' | 'absent' | 'notHeld' | 'unmarked') =>
      weeks.reduce((n, w) => n + w[key], 0)
    expect(sum('held')).toBe(overall.held)
    expect(sum('attended')).toBe(overall.attended)
    expect(sum('absent')).toBe(overall.absent)
    expect(sum('notHeld')).toBe(overall.notHeld)
    expect(sum('unmarked')).toBe(overall.unmarked)
  })
})

describe('shiftMonth', () => {
  it('steps forward across a year end', () => {
    expect(shiftMonth(2026, 11, 1)).toEqual({ year: 2027, month: 0 })
  })

  it('steps back across a year start', () => {
    expect(shiftMonth(2026, 0, -1)).toEqual({ year: 2025, month: 11 })
  })

  it('stays put for a zero step', () => {
    expect(shiftMonth(2026, 7, 0)).toEqual({ year: 2026, month: 7 })
  })
})
