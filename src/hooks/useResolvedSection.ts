import { useEffect, useState } from 'react'
import { onSnapshot } from 'firebase/firestore'
import { BUILT_IN_COLLEGE, getSection, isBuiltInCollege } from '../data/routines'
import { sectionDoc, toSection } from '../services/colleges'
import type { Section } from '../types'

/**
 * The student's own routine, wherever it lives.
 *
 * The built-in college resolves synchronously from bundled data; a
 * student-contributed college streams its one section document from Firestore.
 */
export function useResolvedSection(
  collegeId: string | undefined,
  sectionId: string | undefined,
): { section: Section | undefined; loading: boolean } {
  // A bundled routine always wins, so existing accounts never depend on a read.
  const bundled = getSection(sectionId)
  // Accounts created before colleges existed belong to the built-in college.
  const lookupCollegeId = collegeId ?? (isBuiltInCollege(collegeId) ? BUILT_IN_COLLEGE.id : undefined)

  const [remote, setRemote] = useState<Section | undefined>()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (bundled || !lookupCollegeId || !sectionId) {
      setRemote(undefined)
      setLoading(false)
      return
    }
    setLoading(true)
    const unsub = onSnapshot(
      sectionDoc(lookupCollegeId, sectionId),
      (snap) => {
        setRemote(snap.exists() ? toSection(lookupCollegeId, snap.id, snap.data()) : undefined)
        setLoading(false)
      },
      () => setLoading(false),
    )
    return unsub
  }, [bundled, lookupCollegeId, sectionId])

  if (bundled) return { section: bundled, loading: false }
  return { section: remote, loading }
}
