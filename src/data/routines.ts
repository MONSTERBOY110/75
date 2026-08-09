import type { Section, Slot } from '../types'

/**
 * Class routines, one entry per section.
 *
 * Adding a section = fill in `slots` and flip `status` to 'available'. Nothing
 * else in the app changes: the setup picker, the subject list and every stat
 * are all derived from this file.
 *
 * Slot ids are permanent. Stored attendance records point at them, so if a
 * routine changes mid-semester, repoint the slot at a different subject rather
 * than renumbering it.
 */

/**
 * Year 3 / Semester 5 - CSE-A. 16 classes a week per student.
 *
 * The section splits into two lab batches. All three lab afternoons run two
 * labs in parallel (Lab 1 / Lab 5 / Lab 6), so each is tagged with the batch
 * that attends it. Batch 2 is the group listed second on the printed routine
 * (the "II" rows).
 */
const CSE_A_SLOTS: Slot[] = [
  // Monday
  { id: 'mon-1000', day: 1, start: '10:00', end: '11:40', subjectId: 'pcc-cs501' },
  { id: 'mon-1140', day: 1, start: '11:40', end: '13:20', subjectId: 'pec-it501b' },
  { id: 'mon-1400', day: 1, start: '14:00', end: '15:40', subjectId: 'pcc-cs502' },
  { id: 'mon-1540', day: 1, start: '15:40', end: '17:20', subjectId: 'hsmc501' },

  // Tuesday
  { id: 'tue-1000', day: 2, start: '10:00', end: '11:40', subjectId: 'tt' },
  { id: 'tue-1140', day: 2, start: '11:40', end: '13:20', subjectId: 'pcc-cs501' },
  { id: 'tue-1400', day: 2, start: '14:00', end: '15:40', subjectId: 'pcc-cs502' },

  // Wednesday - SE Lab 6 (batch 1) alongside OS Lab 1 (batch 2)
  { id: 'wed-1000', day: 3, start: '10:00', end: '11:40', subjectId: 'esc501' },
  { id: 'wed-1140', day: 3, start: '11:40', end: '13:20', subjectId: 'pcc-cs503' },
  { id: 'a-wed-1400-selab', day: 3, start: '14:00', end: '16:30', subjectId: 'esc591', batch: '1' },
  { id: 'wed-1400', day: 3, start: '14:00', end: '16:30', subjectId: 'pcc-cs592', batch: '2' },

  // Thursday - OS Lab 1 (batch 1) alongside OOP Lab 5 (batch 2)
  { id: 'thu-1000', day: 4, start: '10:00', end: '11:40', subjectId: 'pcc-cs503' },
  { id: 'thu-1140', day: 4, start: '11:40', end: '13:20', subjectId: 'pec-it501b' },
  { id: 'a-thu-1400-oslab', day: 4, start: '14:00', end: '16:30', subjectId: 'pcc-cs592', batch: '1' },
  { id: 'thu-1400', day: 4, start: '14:00', end: '16:30', subjectId: 'pcc-cs593', batch: '2' },

  // Friday - OOP Lab 5 (batch 1) alongside SE Lab 6 (batch 2)
  { id: 'fri-1000', day: 5, start: '10:00', end: '11:40', subjectId: 'esc501' },
  { id: 'fri-1140', day: 5, start: '11:40', end: '13:20', subjectId: 'hsmc501' },
  { id: 'a-fri-1400-ooplab', day: 5, start: '14:00', end: '16:30', subjectId: 'pcc-cs593', batch: '1' },
  { id: 'fri-1400', day: 5, start: '14:00', end: '16:30', subjectId: 'esc591', batch: '2' },
]

/**
 * Year 3 / Semester 5 - CSE-B and IT, who share a routine.
 *
 * The section splits into two lab batches. Three lab slots run in parallel
 * pairs (Mon 10:00 and Tue 14:00 each host two different labs in two rooms),
 * so each slot is tagged with the batch that attends it. Every batch ends up
 * with one session of each lab per week and 16 classes in total, matching CSE-A.
 *
 * Thursday's 13:20-14:00 break is not a class and is deliberately absent.
 */
const CSE_B_IT_SLOTS: Slot[] = [
  // Monday - parallel labs, then two theory papers
  { id: 'b-mon-1000-oslab', day: 1, start: '10:00', end: '11:40', subjectId: 'pcc-cs592', batch: '1' },
  { id: 'b-mon-1000-ooplab', day: 1, start: '10:00', end: '11:40', subjectId: 'pcc-cs593', batch: '2' },
  { id: 'b-mon-1400', day: 1, start: '14:00', end: '15:40', subjectId: 'hsmc501' },
  { id: 'b-mon-1540', day: 1, start: '15:40', end: '17:20', subjectId: 'pcc-cs501' },

  // Tuesday - two theory papers, then parallel labs
  { id: 'b-tue-1000', day: 2, start: '10:00', end: '11:40', subjectId: 'esc501' },
  { id: 'b-tue-1140', day: 2, start: '11:40', end: '13:20', subjectId: 'tt' },
  { id: 'b-tue-1400-ooplab', day: 2, start: '14:00', end: '15:40', subjectId: 'pcc-cs593', batch: '1' },
  { id: 'b-tue-1400-selab', day: 2, start: '14:00', end: '15:40', subjectId: 'esc591', batch: '2' },

  // Wednesday
  { id: 'b-wed-1000', day: 3, start: '10:00', end: '11:40', subjectId: 'pcc-cs502' },
  { id: 'b-wed-1140', day: 3, start: '11:40', end: '13:20', subjectId: 'pcc-cs503' },
  { id: 'b-wed-1400', day: 3, start: '14:00', end: '16:30', subjectId: 'pec-it501b' },

  // Thursday
  { id: 'b-thu-1000', day: 4, start: '10:00', end: '11:40', subjectId: 'pcc-cs503' },
  { id: 'b-thu-1140', day: 4, start: '11:40', end: '13:20', subjectId: 'pcc-cs501' },
  { id: 'b-thu-1400', day: 4, start: '14:00', end: '15:40', subjectId: 'pec-it501b' },
  { id: 'b-thu-1540', day: 4, start: '15:40', end: '17:20', subjectId: 'pcc-cs502' },

  // Friday - the two batches take their last lab at different times
  { id: 'b-fri-1000-selab', day: 5, start: '10:00', end: '11:40', subjectId: 'esc591', batch: '1' },
  { id: 'b-fri-1140-oslab', day: 5, start: '11:40', end: '12:30', subjectId: 'pcc-cs592', batch: '2' },
  { id: 'b-fri-1400', day: 5, start: '14:00', end: '14:50', subjectId: 'hsmc501' },
  { id: 'b-fri-1450', day: 5, start: '14:50', end: '17:20', subjectId: 'esc501' },
]

export const SECTIONS: Section[] = [
  {
    id: 'y3s5-cse-a',
    year: 3,
    semester: 5,
    label: 'CSE-A',
    status: 'available',
    batches: ['1', '2'],
    slots: CSE_A_SLOTS,
  },
  {
    id: 'y3s5-cse-b-it',
    year: 3,
    semester: 5,
    label: 'CSE-B / IT',
    status: 'available',
    batches: ['1', '2'],
    slots: CSE_B_IT_SLOTS,
  },
]

export function getSection(id: string | undefined | null): Section | undefined {
  if (!id) return undefined
  return SECTIONS.find((s) => s.id === id)
}

/** Every section offered for a year + semester, in listing order. */
export function sectionsFor(year: number, semester: number): Section[] {
  return SECTIONS.filter((s) => s.year === year && s.semester === semester)
}

/**
 * The slots a student actually attends: everything untagged, plus the slots
 * tagged with their batch. A section without batches returns all its slots.
 *
 * When a batched section is read without a batch (a profile saved before the
 * batch existed), the untagged slots still count and the labs are simply
 * omitted rather than double-counted.
 */
export function slotsForBatch(section: Section | undefined, batch?: string): Slot[] {
  if (!section) return []
  if (!section.batches?.length) return section.slots
  return section.slots.filter((slot) => !slot.batch || slot.batch === batch)
}

/**
 * True when a student's section splits for labs but they have no batch on file.
 *
 * Without this their lab slots would quietly vanish from every total, so the
 * setup gate sends them back to choose one.
 */
export function needsBatch(section: Section | undefined, batch?: string): boolean {
  return Boolean(section?.batches?.length) && !batch
}

/** Classes per week for one student. Uses the first batch as the representative. */
export function weeklyClassCount(section: Section): number {
  return slotsForBatch(section, section.batches?.[0]).length
}

/** The distinct subject ids taught in a section, in first-appearance order. */
export function subjectIdsOf(section: Section): string[] {
  const seen = new Set<string>()
  const ids: string[] = []
  for (const slot of section.slots) {
    if (seen.has(slot.subjectId)) continue
    seen.add(slot.subjectId)
    ids.push(slot.subjectId)
  }
  return ids
}
