import { describe, it, expect } from 'vitest'
import {
  BUILT_IN_COLLEGE,
  SECTIONS,
  getSection,
  isBuiltInCollege,
  slotsForBatch,
  weeklyClassCount,
} from './routines'
import { SUBJECTS } from './subjects'
import { minutesOfDay } from '../utils/date'
import type { Slot } from '../types'

/** How many times each subject is taught per week in a given slot list. */
function perSubject(slots: Slot[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const slot of slots) counts[slot.subjectId] = (counts[slot.subjectId] ?? 0) + 1
  return counts
}

describe('routine data integrity', () => {
  const available = SECTIONS.filter((s) => s.status === 'available')

  it('has at least one selectable section', () => {
    expect(available.length).toBeGreaterThan(0)
  })

  it('only points at subjects that exist in the catalogue', () => {
    for (const section of SECTIONS) {
      for (const slot of section.slots) {
        expect(SUBJECTS[slot.subjectId], `${section.id} -> ${slot.subjectId}`).toBeDefined()
      }
    }
  })

  it('never reuses a slot id, because stored records point at them', () => {
    const ids = SECTIONS.flatMap((s) => s.slots.map((slot) => slot.id))
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('only tags slots with batches the section declares', () => {
    for (const section of SECTIONS) {
      for (const slot of section.slots) {
        if (!slot.batch) continue
        expect(section.batches, `${section.id} has batched slots but no batches`).toBeDefined()
        expect(section.batches).toContain(slot.batch)
      }
    }
  })

  it('gives every student a clash-free timetable', () => {
    for (const section of available) {
      for (const batch of section.batches ?? [undefined]) {
        const slots = slotsForBatch(section, batch)
        const seen = new Set<string>()
        for (const slot of slots) {
          const key = `${slot.day}@${slot.start}`
          expect(seen.has(key), `${section.id} batch ${batch}: two classes at ${key}`).toBe(false)
          seen.add(key)
        }
      }
    }
  })

  it('carries a subject entry for every subject its slots reference', () => {
    for (const section of SECTIONS) {
      const listed = new Set(section.subjects.map((s) => s.id))
      for (const slot of section.slots) {
        expect(listed.has(slot.subjectId), `${section.id} omits ${slot.subjectId}`).toBe(true)
      }
      // And nothing listed that is never taught.
      const taught = new Set(section.slots.map((s) => s.subjectId))
      for (const subject of section.subjects) {
        expect(taught.has(subject.id), `${section.id} lists unused ${subject.id}`).toBe(true)
      }
    }
  })

  it('belongs to the built-in college', () => {
    for (const section of SECTIONS) {
      expect(section.collegeId).toBe(BUILT_IN_COLLEGE.id)
    }
  })

  it('treats a missing college id as the built-in one, so old accounts keep working', () => {
    expect(isBuiltInCollege(undefined)).toBe(true)
    expect(isBuiltInCollege(BUILT_IN_COLLEGE.id)).toBe(true)
    expect(isBuiltInCollege('some-firestore-id')).toBe(false)
  })

  it('never ends a class before it starts', () => {
    for (const section of SECTIONS) {
      for (const slot of section.slots) {
        expect(minutesOfDay(slot.end), slot.id).toBeGreaterThan(minutesOfDay(slot.start))
      }
    }
  })
})

/** The semester 5 load every student carries, whatever their section or batch. */
const SEM5_LOAD = {
  'pcc-cs501': 2,
  'pcc-cs502': 2,
  'pcc-cs503': 2,
  'pec-it501b': 2,
  esc501: 2,
  hsmc501: 2,
  tt: 1,
  'pcc-cs592': 1,
  'pcc-cs593': 1,
  esc591: 1,
}

describe.each([
  ['CSE-A', 'y3s5-cse-a'],
  ['CSE-B / IT', 'y3s5-cse-b-it'],
])('%s', (_label, id) => {
  const section = getSection(id)!

  it('splits into two lab batches across 19 listed slots', () => {
    expect(section.batches).toEqual(['1', '2'])
    expect(section.slots).toHaveLength(19)
  })

  it('gives each batch 16 classes a week', () => {
    expect(weeklyClassCount(section)).toBe(16)
    expect(slotsForBatch(section, '1')).toHaveLength(16)
    expect(slotsForBatch(section, '2')).toHaveLength(16)
  })

  it('gives every batch the same subject load', () => {
    expect(perSubject(slotsForBatch(section, '1'))).toEqual(SEM5_LOAD)
    expect(perSubject(slotsForBatch(section, '2'))).toEqual(SEM5_LOAD)
  })

  it('gives each batch exactly one session of each of the three labs', () => {
    for (const batch of section.batches!) {
      const labs = slotsForBatch(section, batch).filter(
        (s) => SUBJECTS[s.subjectId].kind === 'practical',
      )
      expect(labs).toHaveLength(3)
      expect(new Set(labs.map((s) => s.subjectId)).size).toBe(3)
    }
  })

  it('shares all 13 theory classes and batches only the labs', () => {
    const shared = section.slots.filter((s) => !s.batch)
    expect(shared).toHaveLength(13)
    expect(shared.every((s) => SUBJECTS[s.subjectId].kind === 'theory')).toBe(true)

    const batched = section.slots.filter((s) => s.batch)
    expect(batched).toHaveLength(6)
    expect(batched.every((s) => SUBJECTS[s.subjectId].kind === 'practical')).toBe(true)
  })

  it('drops the labs rather than double-counting when no batch is set', () => {
    expect(slotsForBatch(section, undefined)).toHaveLength(13)
  })
})

describe('CSE-A theory slots', () => {
  const section = getSection('y3s5-cse-a')!
  const slotFor = (id: string) => section.slots.find((s) => s.id === id)

  // Corrected in v1.2: the two were the wrong way round. The slot ids are
  // deliberately unchanged so attendance already marked against them follows
  // the correction rather than being orphaned.
  it('teaches AI on Wednesday morning and SE on Thursday late morning', () => {
    expect(slotFor('wed-1000')).toMatchObject({ day: 3, start: '10:00', subjectId: 'pec-it501b' })
    expect(slotFor('thu-1140')).toMatchObject({ day: 4, start: '11:40', subjectId: 'esc501' })
  })

  it('leaves the rest of the theory week alone', () => {
    expect(slotFor('wed-1140')).toMatchObject({ subjectId: 'pcc-cs503' })
    expect(slotFor('thu-1000')).toMatchObject({ subjectId: 'pcc-cs503' })
    expect(slotFor('fri-1000')).toMatchObject({ subjectId: 'esc501' })
    expect(slotFor('mon-1140')).toMatchObject({ subjectId: 'pec-it501b' })
  })
})

describe('CSE-A batch 2 keeps its original slot ids', () => {
  const section = getSection('y3s5-cse-a')!

  // These ids shipped before the batch split and may already have attendance
  // written against them. They must keep pointing at the same lab.
  it.each([
    ['wed-1400', 'pcc-cs592'],
    ['thu-1400', 'pcc-cs593'],
    ['fri-1400', 'esc591'],
  ])('%s still teaches %s for batch 2', (slotId, subjectId) => {
    const slot = section.slots.find((s) => s.id === slotId)
    expect(slot).toBeDefined()
    expect(slot!.subjectId).toBe(subjectId)
    expect(slot!.batch).toBe('2')
  })
})
