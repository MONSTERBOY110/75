import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { onSnapshot } from 'firebase/firestore'
import { auth, initAnalytics } from '../lib/firebase'
import { backfillProfile, userRef } from '../services/user'
import type { UserProfile } from '../types'

interface AuthContextValue {
  user: User | null
  profile: UserProfile | null
  /** True until the initial auth state (and first profile load) resolves. */
  loading: boolean
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [profileReady, setProfileReady] = useState(false)

  useEffect(() => {
    void initAnalytics()
    const unsub = onAuthStateChanged(
      auth,
      (u) => {
        setUser(u)
        setAuthReady(true)
        if (!u) {
          setProfile(null)
          setProfileReady(true)
        } else {
          setProfileReady(false)
        }
      },
      (err) => {
        // A bad config or a dead network must not strand the app on a spinner -
        // fall through to the signed-out screens instead.
        console.error('auth state listener failed:', err)
        setUser(null)
        setProfile(null)
        setAuthReady(true)
        setProfileReady(true)
      },
    )
    return unsub
  }, [])

  // Subscribe to the user's profile document while signed in.
  useEffect(() => {
    if (!user) return
    const unsub = onSnapshot(
      userRef(user.uid),
      (snap) => {
        const data = snap.exists() ? (snap.data() as UserProfile) : null
        setProfile(data)
        setProfileReady(true)
        // Hardening: repair a missing/partial profile doc from the auth user.
        // No-op when the doc is already complete; converges in one write otherwise.
        void backfillProfile(user, data).catch((err) =>
          console.error('profile backfill failed:', err),
        )
      },
      () => setProfileReady(true),
    )
    return unsub
  }, [user])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      loading: !authReady || (!!user && !profileReady),
    }),
    [user, profile, authReady, profileReady],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}

/** Convenience hook used after guards guarantee a signed-in user. */
export function useUid(): string {
  const { user } = useAuth()
  if (!user) throw new Error('useUid called without an authenticated user')
  return user.uid
}
