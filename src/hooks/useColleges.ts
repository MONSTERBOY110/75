import { useEffect, useMemo, useState } from 'react'
import { onSnapshot, orderBy, query } from 'firebase/firestore'
import { useUid } from '../context/AuthContext'
import { BUILT_IN_COLLEGE, SECTIONS, isBuiltInCollege } from '../data/routines'
import {
  collegesCollection,
  ensureBuiltInCollege,
  sectionsCollection,
  toCollege,
  toSection,
} from '../services/colleges'
import type { College, Section } from '../types'

/**
 * Every college a student can pick: ours first, then the ones other students
 * have contributed, alphabetically.
 */
export function useColleges(): { colleges: College[]; loading: boolean } {
  const uid = useUid()
  const [stored, setStored] = useState<College[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Seed our own college into the shared list if it isn't there yet.
    void ensureBuiltInCollege(uid).catch((err) =>
      console.error('could not seed the built-in college:', err),
    )

    const unsub = onSnapshot(
      query(collegesCollection(), orderBy('name')),
      (snap) => {
        setStored(snap.docs.map((d) => toCollege(d.id, d.data())))
        setLoading(false)
      },
      () => setLoading(false),
    )
    return unsub
  }, [uid])

  const colleges = useMemo(() => {
    // Every name comes from Firestore. The bundled entry is only a fallback for
    // a first run or a dropped connection, so the picker is never empty; the
    // stored copy replaces it as soon as the snapshot arrives.
    const byId = new Map<string, College>([[BUILT_IN_COLLEGE.id, BUILT_IN_COLLEGE]])
    for (const college of stored) byId.set(college.id, college)

    return [...byId.values()].sort((a, b) => {
      if (a.builtIn !== b.builtIn) return a.builtIn ? -1 : 1
      return a.name.localeCompare(b.name)
    })
  }, [stored])

  return { colleges, loading }
}

/**
 * The sections on offer at one college. Built-in sections come from the bundled
 * routine data; everything else streams from Firestore.
 */
export function useCollegeSections(collegeId: string | undefined): {
  sections: Section[]
  loading: boolean
} {
  const [remote, setRemote] = useState<Section[]>([])
  // Starts false so the very first render already reports "still loading".
  // Callers clear a section that isn't in the list, and must not do that before
  // the contributed sections have arrived.
  const [loaded, setLoaded] = useState(false)

  const builtIn = Boolean(collegeId) && isBuiltInCollege(collegeId)

  useEffect(() => {
    if (!collegeId) {
      setRemote([])
      setLoaded(true)
      return
    }
    setLoaded(false)
    const unsub = onSnapshot(
      sectionsCollection(collegeId),
      (snap) => {
        setRemote(snap.docs.map((d) => toSection(collegeId, d.id, d.data())))
        setLoaded(true)
      },
      () => setLoaded(true),
    )
    return unsub
  }, [collegeId])

  const sections = useMemo(() => {
    if (!collegeId) return []
    // Our own college keeps its bundled routines and can still take student
    // contributions for sections nobody has entered yet.
    const bundled = builtIn ? SECTIONS : []
    return [...bundled, ...remote].sort(
      (a, b) => a.year - b.year || a.semester - b.semester || a.label.localeCompare(b.label),
    )
  }, [collegeId, builtIn, remote])

  return { sections, loading: Boolean(collegeId) && !loaded }
}
