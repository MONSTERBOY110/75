import { deleteDoc, doc, serverTimestamp, setDoc, writeBatch } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { recordKey } from '../lib/attendance'
import type { AttendanceStatus } from '../types'

export interface MarkInput {
  dateKey: string
  /** Local midnight ms of `dateKey`. */
  date: number
  slotId: string
  subjectId: string
  status: AttendanceStatus
}

function markRef(uid: string, dateKey: string, slotId: string) {
  return doc(db, 'users', uid, 'attendance', recordKey(dateKey, slotId))
}

/**
 * Records one mark. The document id is derived from the date and slot, so
 * re-marking the same class overwrites rather than duplicating - double taps
 * and corrections are both safe with no transaction needed.
 */
export async function markAttendance(uid: string, input: MarkInput): Promise<void> {
  await setDoc(
    markRef(uid, input.dateKey, input.slotId),
    {
      id: recordKey(input.dateKey, input.slotId),
      dateKey: input.dateKey,
      date: input.date,
      slotId: input.slotId,
      subjectId: input.subjectId,
      status: input.status,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}

/** Removes a mark, returning the class to the unmarked state. */
export async function clearMark(uid: string, dateKey: string, slotId: string): Promise<void> {
  await deleteDoc(markRef(uid, dateKey, slotId))
}

/** Marks a whole day's classes as never held - the holiday / strike case. */
export async function markDayNotHeld(uid: string, marks: Omit<MarkInput, 'status'>[]): Promise<void> {
  if (!marks.length) return

  const batch = writeBatch(db)
  for (const mark of marks) {
    batch.set(
      markRef(uid, mark.dateKey, mark.slotId),
      {
        id: recordKey(mark.dateKey, mark.slotId),
        dateKey: mark.dateKey,
        date: mark.date,
        slotId: mark.slotId,
        subjectId: mark.subjectId,
        status: 'notHeld' satisfies AttendanceStatus,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )
  }
  await batch.commit()
}
