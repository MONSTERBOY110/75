import { minutesOfDay } from '../utils/date'
import { WEEKDAY_LABELS } from '../utils/date'
import type { Slot, Subject, SubjectKind } from '../types'

/**
 * Helpers for the student-built routine form. Kept pure so the awkward parts
 * (id generation, clash detection, validation) are unit tested rather than
 * discovered by the first person to add their college.
 */

export interface DraftSubject {
  id: string
  name: string
  code: string
  kind: SubjectKind
}

export interface DraftSlot {
  id: string
  day: number
  start: string
  end: string
  subjectId: string
}

export interface Draft {
  collegeName: string
  label: string
  year: number
  semester: number
  subjects: DraftSubject[]
  slots: DraftSlot[]
}

/** A short uppercase label derived from a subject name, for tight spaces. */
export function shortLabel(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return ''
  if (words.length === 1) return words[0].slice(0, 8).toUpperCase()
  // Initials, but keep a trailing "Lab" readable: "Operating Systems Lab" -> "OS LAB"
  const last = words[words.length - 1]
  const isLab = /^lab/i.test(last)
  const head = (isLab ? words.slice(0, -1) : words).map((w) => w[0]).join('')
  return (isLab ? `${head} LAB` : head).toUpperCase()
}

/** A stable, unique, url-safe id for a new subject. */
export function subjectIdFor(name: string, taken: Iterable<string>): string {
  const base =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 32) || 'subject'

  const used = new Set(taken)
  if (!used.has(base)) return base
  for (let i = 2; ; i++) {
    const candidate = `${base}-${i}`
    if (!used.has(candidate)) return candidate
  }
}

/**
 * A stable id for a period. Encodes the day and start time so it reads clearly
 * in the database, with a suffix if that pairing is somehow reused.
 */
export function slotIdFor(day: number, start: string, taken: Iterable<string>): string {
  const base = `d${day}-${start.replace(':', '')}`
  const used = new Set(taken)
  if (!used.has(base)) return base
  for (let i = 2; ; i++) {
    const candidate = `${base}-${i}`
    if (!used.has(candidate)) return candidate
  }
}

/** Periods on the same day whose times run into each other. */
export function findClashes(slots: DraftSlot[]): string[] {
  const messages: string[] = []
  const byDay = new Map<number, DraftSlot[]>()
  for (const slot of slots) {
    const bucket = byDay.get(slot.day)
    if (bucket) bucket.push(slot)
    else byDay.set(slot.day, [slot])
  }

  for (const [day, daySlots] of byDay) {
    const sorted = [...daySlots].sort((a, b) => minutesOfDay(a.start) - minutesOfDay(b.start))
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1]
      const next = sorted[i]
      if (minutesOfDay(next.start) < minutesOfDay(prev.end)) {
        messages.push(
          `${WEEKDAY_LABELS[day - 1]}: ${next.start} starts before ${prev.start}-${prev.end} ends`,
        )
      }
    }
  }
  return messages
}

/** Everything wrong with the draft, in the order a student should fix it. */
export function validateDraft(draft: Draft, normalizedName: string): string[] {
  const errors: string[] = []

  if (normalizedName.length < 3) errors.push('Enter your college name.')
  if (!draft.label.trim()) errors.push('Enter your section name, for example CSE-A.')
  if (draft.subjects.length === 0) errors.push('Add at least one subject.')
  if (draft.subjects.some((s) => !s.name.trim())) errors.push('Every subject needs a name.')
  if (draft.slots.length === 0) errors.push('Add at least one class to your timetable.')

  for (const slot of draft.slots) {
    if (minutesOfDay(slot.end) <= minutesOfDay(slot.start)) {
      errors.push(`${WEEKDAY_LABELS[slot.day - 1]}: ${slot.start} class must end after it starts.`)
    }
  }

  errors.push(...findClashes(draft.slots))

  const known = new Set(draft.subjects.map((s) => s.id))
  if (draft.slots.some((s) => !known.has(s.subjectId))) {
    errors.push('A class points at a subject that was removed.')
  }

  return errors
}

/** Converts the form state into the shape stored in Firestore. */
export function draftToSection(draft: Draft): { subjects: Subject[]; slots: Slot[] } {
  const subjects: Subject[] = draft.subjects.map((s) => ({
    id: s.id,
    name: s.name.trim(),
    code: s.code.trim() || s.name.trim(),
    short: shortLabel(s.name),
    kind: s.kind,
  }))

  const slots: Slot[] = draft.slots
    .slice()
    .sort((a, b) => a.day - b.day || minutesOfDay(a.start) - minutesOfDay(b.start))
    .map((s) => ({
      id: s.id,
      day: s.day as Slot['day'],
      start: s.start,
      end: s.end,
      subjectId: s.subjectId,
    }))

  return { subjects, slots }
}
