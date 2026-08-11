import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { BUILT_IN_COLLEGE } from '../data/routines'
import { collegeNameKey, normalizeCollegeName } from '../utils/collegeName'
import type { College, Section, Slot, Subject } from '../types'

export function collegesCollection() {
  return collection(db, 'colleges')
}

export function sectionsCollection(collegeId: string) {
  return collection(db, 'colleges', collegeId, 'sections')
}

export function sectionDoc(collegeId: string, sectionId: string) {
  return doc(db, 'colleges', collegeId, 'sections', sectionId)
}

/**
 * Makes sure the built-in college is present in the shared list, so every
 * college name lives in one Firestore collection rather than one being special.
 *
 * Idempotent and safe to call on every load: the rules pin this document's
 * content, and it is never updated once written.
 */
export async function ensureBuiltInCollege(uid: string): Promise<void> {
  const ref = doc(db, 'colleges', BUILT_IN_COLLEGE.id)
  const snap = await getDoc(ref)
  if (snap.exists()) return

  // No `builtIn` flag is stored: the app derives that from the reserved id, and
  // the rules forbid anyone editing or deleting this document afterwards.
  await setDoc(ref, {
    name: BUILT_IN_COLLEGE.name,
    nameKey: BUILT_IN_COLLEGE.nameKey,
    createdBy: uid,
    createdAt: serverTimestamp(),
  })
}

export interface NewSectionInput {
  label: string
  year: number
  semester: number
  subjects: Subject[]
  slots: Slot[]
}

/** Firestore rejects undefined, so build slots without an absent batch key. */
function cleanSlots(slots: Slot[]) {
  return slots.map(({ id, day, start, end, subjectId, batch }) => ({
    id,
    day,
    start,
    end,
    subjectId,
    ...(batch ? { batch } : {}),
  }))
}

/**
 * Adds a student-contributed routine.
 *
 * If a college with the same name already exists (ignoring case, spacing and
 * punctuation) the new section is filed under it instead of creating a
 * duplicate, so "B.P. Poddar" and "BP Poddar" stay one college.
 */
export async function createCollegeWithSection(
  uid: string,
  rawCollegeName: string,
  input: NewSectionInput,
): Promise<{ collegeId: string; sectionId: string; collegeName: string }> {
  const name = normalizeCollegeName(rawCollegeName)
  if (!name) throw new Error('College name is required')
  const nameKey = collegeNameKey(name)

  let collegeId: string
  let collegeName = name

  if (nameKey === BUILT_IN_COLLEGE.nameKey) {
    // Someone re-added our own college; keep its sections in the built-in list.
    throw new Error('That college is already in the list. Pick it above instead.')
  }

  const existing = await getDocs(query(collegesCollection(), where('nameKey', '==', nameKey), limit(1)))
  if (!existing.empty) {
    collegeId = existing.docs[0].id
    collegeName = (existing.docs[0].data().name as string) ?? name
  } else {
    const created = await addDoc(collegesCollection(), {
      name,
      nameKey,
      createdBy: uid,
      createdAt: serverTimestamp(),
    })
    collegeId = created.id
  }

  const sectionId = await addSectionToCollege(uid, collegeId, input)
  return { collegeId, sectionId, collegeName }
}

/**
 * Adds one more routine to a college that already exists, for a student whose
 * section nobody has entered yet.
 */
export async function addSectionToCollege(
  uid: string,
  collegeId: string,
  input: NewSectionInput,
): Promise<string> {
  const section = await addDoc(sectionsCollection(collegeId), {
    label: input.label.trim(),
    year: input.year,
    semester: input.semester,
    status: 'available',
    subjects: input.subjects,
    slots: cleanSlots(input.slots),
    createdBy: uid,
    createdAt: serverTimestamp(),
  })
  return section.id
}

/** Shapes a Firestore section document into the app's Section type. */
export function toSection(collegeId: string, id: string, data: Record<string, unknown>): Section {
  return {
    id,
    collegeId,
    label: (data.label as string) ?? 'Section',
    year: Number(data.year) || 0,
    semester: Number(data.semester) || 0,
    status: 'available',
    subjects: (data.subjects as Subject[]) ?? [],
    slots: (data.slots as Slot[]) ?? [],
    ...(Array.isArray(data.batches) && data.batches.length
      ? { batches: data.batches as string[] }
      : {}),
  }
}

/** Shapes a Firestore college document into the app's College type. */
export function toCollege(id: string, data: Record<string, unknown>): College {
  const name = (data.name as string) ?? 'Unnamed college'
  return {
    id,
    name,
    nameKey: (data.nameKey as string) ?? collegeNameKey(name),
    builtIn: data.builtIn === true || id === BUILT_IN_COLLEGE.id,
  }
}
