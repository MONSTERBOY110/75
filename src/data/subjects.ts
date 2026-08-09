import type { Subject } from '../types'

/**
 * Subject catalogue. Ids are stable slugs referenced by routine slots and by
 * every stored attendance record - treat them as permanent.
 *
 * MC-CS501 (Constitution of India / Essence of Indian Knowledge Tradition,
 * non-credit) is intentionally absent: it has no slot in any routine, so it
 * would only ever show 0/0.
 */
export const SUBJECTS: Record<string, Subject> = {
  // --- Theory ---
  esc501: {
    id: 'esc501',
    code: 'ESC501',
    name: 'Software Engineering',
    short: 'SE',
    kind: 'theory',
  },
  'pcc-cs501': {
    id: 'pcc-cs501',
    code: 'PCC-CS501',
    name: 'Compiler Design',
    short: 'CD',
    kind: 'theory',
  },
  'pcc-cs502': {
    id: 'pcc-cs502',
    code: 'PCC-CS502',
    name: 'Operating Systems',
    short: 'OS',
    kind: 'theory',
  },
  'pcc-cs503': {
    id: 'pcc-cs503',
    code: 'PCC-CS503',
    name: 'Object Oriented Programming',
    short: 'OOP',
    kind: 'theory',
  },
  hsmc501: {
    id: 'hsmc501',
    code: 'HSMC-501',
    name: 'Introduction to Industrial Management',
    short: 'HUM III',
    kind: 'theory',
  },
  'pec-it501b': {
    id: 'pec-it501b',
    code: 'PEC-IT501B(CSE)',
    name: 'Artificial Intelligence',
    short: 'AI',
    kind: 'theory',
  },
  tt: {
    id: 'tt',
    code: 'TT',
    name: 'Technical Training',
    short: 'TT',
    kind: 'theory',
  },

  // --- Practical ---
  esc591: {
    id: 'esc591',
    code: 'ESC-591',
    name: 'Software Engineering Lab',
    short: 'SE LAB',
    kind: 'practical',
  },
  'pcc-cs592': {
    id: 'pcc-cs592',
    code: 'PCC-CS592',
    name: 'Operating Systems Lab',
    short: 'OS LAB',
    kind: 'practical',
  },
  'pcc-cs593': {
    id: 'pcc-cs593',
    code: 'PCC-CS593',
    name: 'Object Oriented Programming Lab',
    short: 'OOP LAB',
    kind: 'practical',
  },
}

/** Looks up a subject, falling back to a readable placeholder for stale ids. */
export function getSubject(id: string): Subject {
  return (
    SUBJECTS[id] ?? {
      id,
      code: id.toUpperCase(),
      name: 'Unknown subject',
      short: id.toUpperCase(),
      kind: 'theory',
    }
  )
}
