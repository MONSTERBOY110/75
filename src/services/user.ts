import type { User } from 'firebase/auth'
import { updateProfile } from 'firebase/auth'
import { collection, doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'
import type { AvatarStyle, UserProfile } from '../types'

export function userRef(uid: string) {
  return doc(db, 'users', uid)
}

export function attendanceCollection(uid: string) {
  return collection(db, 'users', uid, 'attendance')
}

export interface SetupInput {
  year: number
  semester: number
  sectionId: string
  /** Set only for sections that split into lab batches. */
  batch?: string
  /** ms since epoch, local midnight. */
  semesterStartDate: number
  /** Omitted for students signing in with a Google photo. */
  avatarStyle?: AvatarStyle
}

/** Records the student's routine and flips the setup gate open. */
export async function completeSetup(uid: string, input: SetupInput): Promise<void> {
  // Firestore rejects `undefined`, so only send the avatar when one was picked.
  const patch: Record<string, unknown> = {
    year: input.year,
    semester: input.semester,
    sectionId: input.sectionId,
    semesterStartDate: input.semesterStartDate,
    setupCompleted: true,
    updatedAt: serverTimestamp(),
  }
  if (input.avatarStyle) patch.avatarStyle = input.avatarStyle
  if (input.batch) patch.batch = input.batch

  await setDoc(userRef(uid), patch, { merge: true })
}

export async function updateDisplayName(uid: string, name: string): Promise<void> {
  const trimmed = name.trim()
  if (!trimmed) throw new Error('Name cannot be empty')

  await setDoc(userRef(uid), { name: trimmed, updatedAt: serverTimestamp() }, { merge: true })
  // Keep the auth record in step so a fresh sign-in shows the same name.
  if (auth.currentUser) await updateProfile(auth.currentUser, { displayName: trimmed })
}

export async function updateBatch(uid: string, batch: string): Promise<void> {
  await setDoc(userRef(uid), { batch, updatedAt: serverTimestamp() }, { merge: true })
}

export async function updateAvatarStyle(uid: string, avatarStyle: AvatarStyle): Promise<void> {
  await setDoc(userRef(uid), { avatarStyle, updatedAt: serverTimestamp() }, { merge: true })
}

export async function updateSemesterStart(uid: string, semesterStartDate: number): Promise<void> {
  await setDoc(userRef(uid), { semesterStartDate, updatedAt: serverTimestamp() }, { merge: true })
}

/**
 * Repairs a missing or partial profile document from the auth user.
 *
 * Writes only when something is actually absent, so it is a no-op in the steady
 * state and converges in a single pass rather than looping the snapshot listener.
 */
export async function backfillProfile(user: User, existing: UserProfile | null): Promise<void> {
  const patch: Record<string, unknown> = {}

  if (!existing) {
    patch.id = user.uid
    patch.name = user.displayName || 'Student'
    patch.email = user.email || ''
    patch.photoURL = user.photoURL ?? null
    patch.setupCompleted = false
    patch.createdAt = serverTimestamp()
  } else {
    if (!existing.name) patch.name = user.displayName || 'Student'
    if (!existing.email) patch.email = user.email || ''
    if (existing.photoURL == null && user.photoURL) patch.photoURL = user.photoURL
  }

  if (Object.keys(patch).length === 0) return
  patch.updatedAt = serverTimestamp()
  await setDoc(userRef(user.uid), patch, { merge: true })
}
