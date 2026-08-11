import { useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { slotsForBatch } from '../data/routines'
import {
  aggregate,
  listOccurrences,
  statsFor,
  type Occurrence,
  type SubjectStat,
  type Totals,
} from '../lib/attendance'
import { isoWeekday, minutesOfDay, startOfDay, toDateKey } from '../utils/date'
import type { AttendanceRecord, Section, Slot, Subject } from '../types'
import { useAttendanceRecords } from './useAttendanceRecords'
import { useNow } from './useNow'
import { useResolvedSection } from './useResolvedSection'

export interface Stats {
  loading: boolean
  section: Section | undefined
  /** The section's slots narrowed to this student's batch. */
  slots: Slot[]
  /** The section's papers, for resolving a slot or stat to a subject. */
  subjectsById: Map<string, Subject>
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

/** Stands in for a subject the routine references but the section never listed. */
function placeholderSubject(id: string): Subject {
  return { id, code: id.toUpperCase(), name: 'Unknown subject', short: id.toUpperCase(), kind: 'theory' }
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
  const { section, loading: sectionLoading } = useResolvedSection(
    profile?.collegeId,
    profile?.sectionId,
  )
  const now = useNow()

  const semesterStart = profile?.semesterStartDate
  const batch = profile?.batch

  return useMemo(() => {
    // Only the classes this student actually attends: for a section that splits
    // for labs, their batch's slots plus everything shared.
    const slots = slotsForBatch(section, batch)
    const occurrences = section && semesterStart ? listOccurrences(slots, semesterStart, now) : []

    // Subjects come from the section, because every college has its own syllabus.
    const subjectsById = new Map<string, Subject>()
    for (const subject of section?.subjects ?? []) subjectsById.set(subject.id, subject)
    const kindOf = (id: string) => (subjectsById.get(id) ?? placeholderSubject(id)).kind

    const bySubject = statsFor(occurrences, records)

    // Routine order, but with every practical pushed below the theory papers.
    const seen = new Set<string>()
    const ordered: string[] = []
    for (const slot of slots) {
      if (seen.has(slot.subjectId)) continue
      seen.add(slot.subjectId)
      ordered.push(slot.subjectId)
      if (!subjectsById.has(slot.subjectId)) {
        subjectsById.set(slot.subjectId, placeholderSubject(slot.subjectId))
      }
    }
    const subjectIds = [
      ...ordered.filter((id) => kindOf(id) === 'theory'),
      ...ordered.filter((id) => kindOf(id) === 'practical'),
    ]

    // Subjects with no occurrences yet still need a zeroed row on the list.
    const statList = subjectIds.map((id) => bySubject.get(id) ?? { ...EMPTY, subjectId: id })
    for (const stat of statList) bySubject.set(stat.subjectId, stat)

    const todayDate = startOfDay(now)
    const weekday = isoWeekday(todayDate)
    const todaySlots = slots
      .filter((slot) => slot.day === weekday)
      .sort((a, b) => minutesOfDay(a.start) - minutesOfDay(b.start))

    return {
      loading: loading || sectionLoading,
      section,
      slots,
      subjectsById,
      records,
      occurrences,
      subjectIds,
      bySubject,
      overall: aggregate(statList),
      theory: aggregate(statList.filter((s) => kindOf(s.subjectId) === 'theory')),
      practical: aggregate(statList.filter((s) => kindOf(s.subjectId) === 'practical')),
      todaySlots,
      todayKey: toDateKey(todayDate),
      todayDate,
      now,
    }
  }, [section, batch, semesterStart, records, now, loading, sectionLoading])
}
