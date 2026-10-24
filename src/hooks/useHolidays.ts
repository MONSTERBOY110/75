import { useEffect, useState } from 'react'
import { onSnapshot, orderBy, query } from 'firebase/firestore'
import { useUid } from '../context/AuthContext'
import { holidaysCollection, toHoliday } from '../services/holidays'
import type { Holiday } from '../types'

/**
 * The student's holidays, live. Called once from `useComputeStats`, so every
 * screen counts from the same set and adding one updates them all at once.
 */
export function useHolidays(): { holidays: Holiday[]; loading: boolean } {
  const uid = useUid()
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onSnapshot(
      query(holidaysCollection(uid), orderBy('from', 'desc')),
      (snap) => {
        setHolidays(snap.docs.map((d) => toHoliday(d.id, d.data())).filter((h) => h.from))
        setLoading(false)
      },
      () => setLoading(false),
    )
    return unsub
  }, [uid])

  return { holidays, loading }
}
