import { useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { getSection, slotsForBatch } from '../data/routines'
import { getSubject } from '../data/subjects'
import { aggregate, listOccurrences, statsFor, type Occurrence, type SubjectStat, type Totals } from '../lib/attendance'
import { isoWeekday, minutesOfDay, startOfDay, toDateKey } from '../utils/date'
import type { AttendanceRecord, Section, Slot } from '../types'
import { useAttendanceRecords } from './useAttendanceRecords'
import { useNow } from './useNow'

export interface Stats {
  loading: boolean
  section: Section | undefined
  /** The section's slots narrowed to this student's batch. */
  slots: Slot[]
  records: AttendanceRecord[]
  occurrences: Occurrence[]
  /** Subject ids in display order: theory first, then practicals. */
  subjectIds: string[]
  bySubject: Map<string, SubjectStat>
  overall: Totals
  theory: Totals
  practical: Totals
  /** Today's scheduled slots, earliest first - including ones yet to start. */
  todaySlots: Slot[]
  todayKey: string
  todayDate: number
  now: number
}

const EMPTY: Totals = {
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

/**
 * Every number the app shows, derived in one place from the routine, the
 * student's semester start date and the live record set.
 *
 * Call this once per session - StatsProvider does - and read the result through
 * `useStats()` so the app keeps a single Firestore listener.
 */
export function useComputeStats(): Stats {
  const { profile } = useAuth()
  const { records, loading } = useAttendanceRecords()
  const now = useNow()

  const sectionId = profile?.sectionId
  const semesterStart = profile?.semesterStartDate
  const batch = profile?.batch

  return useMemo(() => {
    const section = getSection(sectionId)
    // Only the classes this student actually attends: for a section that splits
    // for labs, their batch's slots plus everything shared.
    const slots = slotsForBatch(section, batch)
    const occurrences =
      section && semesterStart ? listOccurrences(slots, semesterStart, now) : []

    const bySubject = statsFor(occurrences, records)

    // Routine order, but with every practical pushed below the theory papers.
    const seen = new Set<string>()
    const ordered: string[] = []
    for (const slot of slots) {
      if (seen.has(slot.subjectId)) continue
      seen.add(slot.subjectId)
      ordered.push(slot.subjectId)
    }
    const subjectIds = [
      ...ordered.filter((id) => getSubject(id).kind === 'theory'),
      ...ordered.filter((id) => getSubject(id).kind === 'practical'),
    ]

    // Subjects with no occurrences yet still need a zeroed row on the list.
    const statList = subjectIds.map(
      (id) => bySubject.get(id) ?? { ...EMPTY, subjectId: id },
    )
    for (const stat of statList) bySubject.set(stat.subjectId, stat)

    const todayDate = startOfDay(now)
    const weekday = isoWeekday(todayDate)
    const todaySlots = slots
      .filter((slot) => slot.day === weekday)
      .sort((a, b) => minutesOfDay(a.start) - minutesOfDay(b.start))

    return {
      loading,
      section,
      slots,
      records,
      occurrences,
      subjectIds,
      bySubject,
      overall: aggregate(statList),
      theory: aggregate(statList.filter((s) => getSubject(s.subjectId).kind === 'theory')),
      practical: aggregate(statList.filter((s) => getSubject(s.subjectId).kind === 'practical')),
      todaySlots,
      todayKey: toDateKey(todayDate),
      todayDate,
      now,
    }
  }, [sectionId, batch, semesterStart, records, now, loading])
}
