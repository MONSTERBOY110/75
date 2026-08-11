import { describe, it, expect } from 'vitest'
import {
  draftToSection,
  findClashes,
  shortLabel,
  slotIdFor,
  subjectIdFor,
  validateDraft,
  type Draft,
  type DraftSlot,
} from './routineDraft'
import { addMinutesToTime } from '../utils/date'

const slot = (day: number, start: string, end: string, subjectId = 'maths'): DraftSlot => ({
  id: `d${day}-${start.replace(':', '')}`,
  day,
  start,
  end,
  subjectId,
})

function draft(over: Partial<Draft> = {}): Draft {
  return {
    collegeName: 'ABC College',
    label: 'CSE-A',
    year: 3,
    semester: 5,
    subjects: [{ id: 'maths', name: 'Mathematics', code: 'M101', kind: 'theory' }],
    slots: [slot(1, '10:00', '11:00')],
    ...over,
  }
}

describe('shortLabel', () => {
  it('initialises a multi word name', () => {
    expect(shortLabel('Operating Systems')).toBe('OS')
    expect(shortLabel('Object Oriented Programming')).toBe('OOP')
  })

  it('keeps Lab readable at the end', () => {
    expect(shortLabel('Operating Systems Lab')).toBe('OS LAB')
    expect(shortLabel('Software Engineering Lab')).toBe('SE LAB')
  })

  it('truncates a single long word', () => {
    expect(shortLabel('Thermodynamics')).toBe('THERMODY')
  })

  it('is empty for empty input', () => {
    expect(shortLabel('   ')).toBe('')
  })
})

describe('subjectIdFor', () => {
  it('slugifies the name', () => {
    expect(subjectIdFor('Operating Systems', [])).toBe('operating-systems')
    expect(subjectIdFor('B.P. Maths & Stats', [])).toBe('b-p-maths-stats')
  })

  it('never collides with an existing id', () => {
    expect(subjectIdFor('Maths', ['maths'])).toBe('maths-2')
    expect(subjectIdFor('Maths', ['maths', 'maths-2'])).toBe('maths-3')
  })

  it('falls back for a name with no usable characters', () => {
    expect(subjectIdFor('!!!', [])).toBe('subject')
  })
})

describe('slotIdFor', () => {
  it('encodes the day and start time', () => {
    expect(slotIdFor(3, '14:00', [])).toBe('d3-1400')
  })

  it('suffixes a repeat rather than overwriting one', () => {
    expect(slotIdFor(3, '14:00', ['d3-1400'])).toBe('d3-1400-2')
  })
})

describe('findClashes', () => {
  it('accepts back to back classes', () => {
    expect(findClashes([slot(1, '10:00', '11:00'), slot(1, '11:00', '12:00')])).toEqual([])
  })

  it('flags an overlap on the same day', () => {
    const clashes = findClashes([slot(1, '10:00', '11:40'), slot(1, '11:00', '12:00')])
    expect(clashes).toHaveLength(1)
    expect(clashes[0]).toContain('MON')
  })

  it('allows the same time on different days', () => {
    expect(findClashes([slot(1, '10:00', '11:00'), slot(2, '10:00', '11:00')])).toEqual([])
  })

  it('catches an overlap however the periods were entered', () => {
    expect(findClashes([slot(4, '14:00', '16:30'), slot(4, '15:00', '16:00')])).toHaveLength(1)
  })
})

describe('validateDraft', () => {
  it('passes a complete draft', () => {
    expect(validateDraft(draft(), 'ABC College')).toEqual([])
  })

  it('requires a college name', () => {
    expect(validateDraft(draft(), '')).toContain('Enter your college name.')
  })

  it('requires a section label', () => {
    expect(validateDraft(draft({ label: '  ' }), 'ABC College')).toContain(
      'Enter your section name, for example CSE-A.',
    )
  })

  it('requires at least one subject and one class', () => {
    const errors = validateDraft(draft({ subjects: [], slots: [] }), 'ABC College')
    expect(errors).toContain('Add at least one subject.')
    expect(errors).toContain('Add at least one class to your timetable.')
  })

  it('rejects a class that ends before it starts', () => {
    const errors = validateDraft(draft({ slots: [slot(2, '14:00', '13:00')] }), 'ABC College')
    expect(errors.some((e) => e.includes('must end after it starts'))).toBe(true)
  })

  it('rejects a class pointing at a deleted subject', () => {
    const errors = validateDraft(draft({ slots: [slot(1, '10:00', '11:00', 'gone')] }), 'ABC College')
    expect(errors).toContain('A class points at a subject that was removed.')
  })

  it('surfaces clashes', () => {
    const errors = validateDraft(
      draft({ slots: [slot(1, '10:00', '12:00'), slot(1, '11:00', '13:00')] }),
      'ABC College',
    )
    expect(errors.some((e) => e.includes('starts before'))).toBe(true)
  })
})

describe('draftToSection', () => {
  it('sorts periods by day then time and derives codes and short names', () => {
    const { subjects, slots } = draftToSection(
      draft({
        subjects: [{ id: 'os', name: 'Operating Systems', code: '', kind: 'theory' }],
        slots: [slot(3, '14:00', '15:00', 'os'), slot(1, '09:00', '10:00', 'os')],
      }),
    )

    expect(slots.map((s) => `${s.day}@${s.start}`)).toEqual(['1@09:00', '3@14:00'])
    // A blank code falls back to the full name rather than storing an empty string.
    expect(subjects[0]).toMatchObject({ code: 'Operating Systems', short: 'OS', kind: 'theory' })
  })

  it('never emits a batch key, since student routines do not split', () => {
    const { slots } = draftToSection(draft())
    expect(Object.keys(slots[0])).toEqual(['id', 'day', 'start', 'end', 'subjectId'])
  })
})

describe('addMinutesToTime', () => {
  it('advances a time by a duration', () => {
    expect(addMinutesToTime('10:00', 100)).toBe('11:40')
    expect(addMinutesToTime('09:05', 55)).toBe('10:00')
  })

  it('clamps at the end of the day rather than rolling over', () => {
    expect(addMinutesToTime('23:30', 120)).toBe('23:59')
  })
})
