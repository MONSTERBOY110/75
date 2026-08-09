import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, googleProvider } from '../lib/firebase'
import { userRef } from './user'

/** Create the users/{uid} profile document if it does not yet exist. */
async function ensureUserDoc(params: {
  uid: string
  name: string
  email: string
  photoURL?: string | null
}): Promise<void> {
  const ref = userRef(params.uid)
  const snap = await getDoc(ref)
  if (snap.exists()) return

  await setDoc(ref, {
    id: params.uid,
    name: params.name || 'Student',
    email: params.email,
    photoURL: params.photoURL ?? null,
    setupCompleted: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function signUpWithEmail(name: string, email: string, password: string): Promise<void> {
  const cred = await createUserWithEmailAndPassword(auth, email, password)
  await updateProfile(cred.user, { displayName: name })
  await ensureUserDoc({ uid: cred.user.uid, name, email: cred.user.email ?? email })
}

export async function signInWithEmail(email: string, password: string): Promise<void> {
  await signInWithEmailAndPassword(auth, email, password)
}

export async function signInWithGoogle(): Promise<void> {
  const cred = await signInWithPopup(auth, googleProvider)
  await ensureUserDoc({
    uid: cred.user.uid,
    name: cred.user.displayName ?? 'Student',
    email: cred.user.email ?? '',
    photoURL: cred.user.photoURL,
  })
}

export async function logout(): Promise<void> {
  await signOut(auth)
}

/** Translates Firebase auth error codes into copy a student can act on. */
export function authErrorMessage(error: unknown): string {
  const code = (error as { code?: string })?.code ?? ''
  switch (code) {
    case 'auth/invalid-email':
      return 'Please enter a valid email address.'
    case 'auth/user-disabled':
      return 'This account has been disabled.'
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password.'
    case 'auth/email-already-in-use':
      return 'An account already exists with this email.'
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.'
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return '' // user cancelled - stay on the screen silently
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection.'
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.'
    default:
      return 'Something went wrong. Please try again.'
  }
}
