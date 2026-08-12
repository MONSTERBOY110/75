import { useEffect, useMemo, useState } from 'react'
import { onSnapshot } from 'firebase/firestore'
import { useAuth } from '../context/AuthContext'
import { BUILT_IN_COLLEGE } from '../data/routines'
import { rankStandings, type Board } from '../lib/leaderboard'
import { membersCollection, toStanding } from '../services/leaderboard'
import type { Standing } from '../types'

/**
 * The signed-in student's own college board.
 *
 * Only that college's `members` subcollection is read, so "my college only" is a
 * property of the path rather than a filter someone could forget. A college is
 * tens to a few hundred rows, so ordering happens here: no composite index, and
 * an exact total for "4th of 23".
 */
export function useLeaderboard(): { board: Board; loading: boolean } {
  const { user, profile } = useAuth()
  const [standings, setStandings] = useState<Standing[]>([])
  const [loaded, setLoaded] = useState(false)

  const collegeId = profile?.collegeId ?? (profile ? BUILT_IN_COLLEGE.id : undefined)

  useEffect(() => {
    if (!collegeId) return
    setLoaded(false)
    const unsub = onSnapshot(
      membersCollection(collegeId),
      (snap) => {
        setStandings(snap.docs.map((d) => toStanding(d.id, d.data())))
        setLoaded(true)
      },
      () => setLoaded(true),
    )
    return unsub
  }, [collegeId])

  const board = useMemo(() => rankStandings(standings, user?.uid), [standings, user?.uid])

  return { board, loading: Boolean(collegeId) && !loaded }
}
