import { collection, deleteDoc, doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { AvatarStyle, Standing } from '../types'

export function membersCollection(collegeId: string) {
  return collection(db, 'colleges', collegeId, 'members')
}

function memberRef(collegeId: string, uid: string) {
  return doc(db, 'colleges', collegeId, 'members', uid)
}

export interface StandingInput {
  name: string
  photoURL?: string | null
  avatarStyle?: AvatarStyle
  sectionLabel: string
  percent: number
  attended: number
  held: number
}

/**
 * Publishes the student's own standing so their college's leaderboard can read
 * it without anyone gaining access to `users/{uid}`.
 *
 * The document id is the uid, which is also what the rules check, so a student
 * can only ever write their own row.
 */
export async function publishStanding(
  collegeId: string,
  uid: string,
  input: StandingInput,
): Promise<void> {
  await setDoc(
    memberRef(collegeId, uid),
    {
      uid,
      name: input.name,
      // Firestore rejects undefined, and an absent avatar is meaningful.
      photoURL: input.photoURL ?? null,
      ...(input.avatarStyle ? { avatarStyle: input.avatarStyle } : {}),
      sectionLabel: input.sectionLabel,
      percent: input.percent,
      attended: input.attended,
      held: input.held,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}

/** Drops the student off a board they have left, so nobody lingers. */
export async function removeStanding(collegeId: string, uid: string): Promise<void> {
  await deleteDoc(memberRef(collegeId, uid))
}

export function toStanding(id: string, data: Record<string, unknown>): Standing {
  return {
    uid: (data.uid as string) ?? id,
    name: (data.name as string) ?? 'Student',
    photoURL: (data.photoURL as string | null) ?? null,
    avatarStyle: data.avatarStyle as AvatarStyle | undefined,
    sectionLabel: (data.sectionLabel as string) ?? '',
    percent: Number(data.percent) || 0,
    attended: Number(data.attended) || 0,
    held: Number(data.held) || 0,
    updatedAt: (data.updatedAt as Standing['updatedAt']) ?? null,
  }
}
