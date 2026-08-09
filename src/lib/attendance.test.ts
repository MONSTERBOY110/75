import { describe, it, expect } from 'vitest'
import type { AttendanceRecord, AttendanceStatus, Slot } from '../types'
import {
  aggregate,
  band,
  buildLog,
  listOccurrences,
  recordKey,
  statsFor,
  TARGET,
} from './attendance'

// 3 Aug 2026 is a Monday. Every fixture below is anchored to it.
const MON = new Date(2026, 7, 3)
const at = (dayOffset: number, hour: number, minute = 0) =>
  new Date(2026, 7, 3 + dayOffset, hour, minute).getTime()

const START = MON.getTime()

/** A trimmed routine: 2 classes Monday, 1 Wednesday. */
const SLOTS: Slot[] = [
  { id: 'mon-1000', day: 1, start: '10:00', end: '11:40', subjectId: 'math' },
  { id: 'mon-1400', day: 1, start: '14:00', end: '15:40', subjectId: 'phys' },
  { id: 'wed-1000', day: 3, start: '10:00', end: '11:40', subjectId: 'math' },
]

function rec(
  dayOffset: number,
  slotId: string,
  subjectId: string,
  status: AttendanceStatus,
): AttendanceRecord {
  const date = new Date(2026, 7, 3 + dayOffset).getTime()
  const dateKey = new Date(date).toLocaleDateString('en-CA') // YYYY-MM-DD, local
  return {
    id: recordKey(dateKey, slotId),
    dateKey,
    date,
    slotId,
    subjectId,
    status,
    createdAt: null,
    updatedAt: null,
  }
}

describe('listOccurrences', () => {
  it("includes only the slots whose start time has already passed today", () => {
    // Monday 10:30 - the 10:00 class has begun, the 14:00 one has not.
    expect(listOccurrences(SLOTS, START, at(0, 10, 30)).map((o) => o.slotId)).toEqual(['mon-1000'])
  })

  it('includes nothing before the first class of the semester', () => {
    expect(listOccurrences(SLOTS, START, at(0, 9, 0))).toEqual([])
  })

  it('includes a slot exactly at its start minute', () => {
    expect(listOccurrences(SLOTS, START, at(0, 10, 0)).map((o) => o.slotId)).toEqual(['mon-1000'])
  })

  it('covers a full day once it is over', () => {
    expect(listOccurrences(SLOTS, START, at(0, 23, 0))).toHaveLength(2)
  })

  it('skips days with no scheduled classes', () => {
    // Tuesday has no slots, so Tuesday night still shows only Monday's two.
    expect(listOccurrences(SLOTS, START, at(1, 23, 0))).toHaveLength(2)
  })

  it('repeats week after week without drift', () => {
    // 10 whole weeks: 10 Mondays x 2 + 10 Wednesdays x 1 = 30.
    expect(listOccurrences(SLOTS, START, at(69, 23, 0))).toHaveLength(30)
  })

  it('returns occurrences in ascending date order with unique keys', () => {
    const occ = listOccurrences(SLOTS, START, at(20, 23, 0))
    const dates = occ.map((o) => o.date)
    expect([...dates].sort((a, b) => a - b)).toEqual(dates)
    expect(new Set(occ.map((o) => recordKey(o.dateKey, o.slotId))).size).toBe(occ.length)
  })

  it('is empty when the semester has not started yet', () => {
    expect(listOccurrences(SLOTS, at(7, 0), at(0, 23))).toEqual([])
  })

  it('ignores classes scheduled before the semester start date', () => {
    // Start on Wednesday: that week contributes only the Wednesday class.
    expect(listOccurrences(SLOTS, at(2, 0), at(2, 23)).map((o) => o.slotId)).toEqual(['wed-1000'])
  })
})

describe('statsFor', () => {
  const occurrences = listOccurrences(SLOTS, START, at(2, 23, 0)) // Mon x2 + Wed x1

  it('counts unmarked classes against you', () => {
    const stats = statsFor(occurrences, [])
    const math = stats.get('math')!
    expect(math).toMatchObject({
      scheduled: 2,
      notHeld: 0,
      held: 2,
      attended: 0,
      absent: 0,
      unmarked: 2,
      percent: 0,
    })
  })

  it('splits marks into attended / absent / not held', () => {
    const stats = statsFor(occurrences, [
      rec(0, 'mon-1000', 'math', 'attended'),
      rec(2, 'wed-1000', 'math', 'absent'),
      rec(0, 'mon-1400', 'phys', 'notHeld'),
    ])
    expect(stats.get('math')).toMatchObject({ held: 2, attended: 1, absent: 1, unmarked: 0, percent: 50 })
    // The physics class was never held, so it is excluded from the total.
    expect(stats.get('phys')).toMatchObject({ scheduled: 1, notHeld: 1, held: 0, percent: 0 })
  })

  it('reports 0% rather than NaN when nothing has been held', () => {
    const stats = statsFor(occurrences, [
      rec(0, 'mon-1000', 'math', 'notHeld'),
      rec(2, 'wed-1000', 'math', 'notHeld'),
    ])
    expect(stats.get('math')!.percent).toBe(0)
    expect(Number.isNaN(stats.get('math')!.percent)).toBe(false)
  })

  it('ignores records for dates outside the window', () => {
    const stats = statsFor(occurrences, [rec(30, 'mon-1000', 'math', 'attended')])
    expect(stats.get('math')!.attended).toBe(0)
  })

  it('lists every scheduled subject even with no records at all', () => {
    expect([...statsFor(occurrences, []).keys()].sort()).toEqual(['math', 'phys'])
  })
})

describe('canSkip / mustAttend', () => {
  const many = listOccurrences(SLOTS, START, at(69, 23, 0)).filter((o) => o.subjectId === 'math')

  /** Marks the first `attended` math classes present and the rest absent. */
  function withPattern(attended: number, held: number) {
    const window = many.slice(0, held)
    return statsFor(
      window,
      window.map((o, i) =>
        rec(
          Math.round((o.date - START) / 86_400_000),
          o.slotId,
          o.subjectId,
          i < attended ? 'attended' : 'absent',
        ),
      ),
    ).get('math')!
  }

  it('says how many more classes you can skip and still hold 75%', () => {
    const s = withPattern(9, 10) // 90%
    expect(s.percent).toBe(90)
    expect(s.canSkip).toBe(2) // 9/12 is exactly 75%
  })

  it('never suggests skipping when you are already below target', () => {
    const s = withPattern(7, 10) // 70%
    expect(s.canSkip).toBe(0)
  })

  it('says how many classes in a row will bring you back to 75%', () => {
    const s = withPattern(7, 10) // 70%
    expect(s.mustAttend).toBe(2) // 9/12 = 75%
  })

  it('asks for nothing once you are at or above target', () => {
    expect(withPattern(8, 10).mustAttend).toBe(0) // 80%
    expect(withPattern(15, 20).mustAttend).toBe(0) // exactly 75%
  })

  it('agrees with the target constant', () => {
    const s = withPattern(7, 10)
    const after = (s.attended + s.mustAttend) / (s.held + s.mustAttend)
    expect(after).toBeGreaterThanOrEqual(TARGET)
  })
})

describe('aggregate', () => {
  it('sums the underlying counts rather than averaging percentages', () => {
    const total = aggregate([
      { subjectId: 'a', scheduled: 10, notHeld: 0, held: 10, attended: 10, absent: 0, unmarked: 0, percent: 100, canSkip: 3, mustAttend: 0 },
      { subjectId: 'b', scheduled: 90, notHeld: 0, held: 90, attended: 45, absent: 45, unmarked: 0, percent: 50, canSkip: 0, mustAttend: 0 },
    ])
    // A naive average would say 75%; the honest number is 55/100.
    expect(total).toMatchObject({ held: 100, attended: 55, percent: 55 })
  })

  it('is 0% for an empty list', () => {
    expect(aggregate([])).toMatchObject({ held: 0, attended: 0, percent: 0 })
  })
})

describe('band', () => {
  it('classifies against the 75% line', () => {
    expect(band(80, 10)).toBe('safe')
    expect(band(75, 10)).toBe('safe')
    expect(band(74.9, 10)).toBe('warn')
    expect(band(65, 10)).toBe('warn')
    expect(band(64.9, 10)).toBe('danger')
    expect(band(0, 0)).toBe('empty')
  })
})

describe('buildLog', () => {
  const occurrences = listOccurrences(SLOTS, START, at(7, 23, 0))

  it('lists newest first and marks gaps as unmarked', () => {
    const log = buildLog(
      occurrences.filter((o) => o.subjectId === 'math'),
      [rec(0, 'mon-1000', 'math', 'attended')],
    )
    expect(log.map((e) => e.status)).toEqual(['unmarked', 'unmarked', 'attended'])
    expect(log[0].date).toBeGreaterThan(log[log.length - 1].date)
  })

  it('carries the slot time through for display', () => {
    const log = buildLog(occurrences.slice(0, 1), [])
    expect(log[0]).toMatchObject({ slotId: 'mon-1000', start: '10:00', end: '11:40' })
  })
})
