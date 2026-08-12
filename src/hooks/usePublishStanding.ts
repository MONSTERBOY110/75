import { useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { BUILT_IN_COLLEGE } from '../data/routines'
import { publishStanding, removeStanding } from '../services/leaderboard'
import type { Section } from '../types'
import type { Totals } from '../lib/attendance'

/**
 * Keeps the student's leaderboard row in step with their own numbers.
 *
 * Called once from StatsContext. It writes only when something a reader would
 * actually see has changed, so marking a single class costs one write rather
 * than one per re-render. Switching college removes the row from the board they
 * left, so nobody lingers where they no longer study.
 */
export function usePublishStanding(section: Section | undefined, overall: Totals): void {
  const { user, profile } = useAuth()
  const lastPublished = useRef<string | null>(null)
  const lastCollegeId = useRef<string | null>(null)

  const uid = user?.uid
  const collegeId = profile?.collegeId ?? (profile ? BUILT_IN_COLLEGE.id : undefined)
  const ready = Boolean(uid && collegeId && profile?.setupCompleted && section)

  useEffect(() => {
    if (!uid || !collegeId || !ready || !section || !profile) return

    // Leaving a college: take the old row down before publishing the new one.
    const previous = lastCollegeId.current
    if (previous && previous !== collegeId) {
      void removeStanding(previous, uid).catch(() => {})
      lastPublished.current = null
    }
    lastCollegeId.current = collegeId

    const payload = {
      name: profile.name || 'Student',
      photoURL: profile.photoURL ?? null,
      avatarStyle: profile.avatarStyle,
      sectionLabel: section.label,
      percent: overall.percent,
      attended: overall.attended,
      held: overall.held,
    }

    const fingerprint = JSON.stringify([collegeId, payload])
    if (fingerprint === lastPublished.current) return
    lastPublished.current = fingerprint

    void publishStanding(collegeId, uid, payload).catch((err) => {
      // A failed publish only costs a stale leaderboard row, so never surface it.
      console.error('could not publish leaderboard standing:', err)
      lastPublished.current = null
    })
  }, [
    uid,
    collegeId,
    ready,
    section,
    profile,
    overall.percent,
    overall.attended,
    overall.held,
  ])
}
