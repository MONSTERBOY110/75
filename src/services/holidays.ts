import { addDoc, collection, deleteDoc, doc, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { Holiday } from '../types'

/** Under the student's own document, so the existing owner-only rules cover it. */
export function holidaysCollection(uid: string) {
  return collection(db, 'users', uid, 'holidays')
}

export interface HolidayInput {
  name: string
  /** "YYYY-MM-DD". */
  from: string
  /** "YYYY-MM-DD", inclusive. */
  to: string
}

export async function addHoliday(uid: string, input: HolidayInput): Promise<void> {
  await addDoc(holidaysCollection(uid), {
    name: input.name.trim() || 'Holiday',
    from: input.from,
    to: input.to,
    createdAt: serverTimestamp(),
  })
}

/** Removing a holiday brings its classes straight back into the totals. */
export async function removeHoliday(uid: string, id: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'holidays', id))
}

export function toHoliday(id: string, data: Record<string, unknown>): Holiday {
  const from = (data.from as string) ?? ''
  return {
    id,
    name: (data.name as string) || 'Holiday',
    from,
    to: (data.to as string) || from,
    createdAt: (data.createdAt as Holiday['createdAt']) ?? null,
  }
}
