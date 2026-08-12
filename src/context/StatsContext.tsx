import { createContext, useContext } from 'react'
import { Outlet } from 'react-router-dom'
import { useComputeStats, type Stats } from '../hooks/useStats'
import { usePublishStanding } from '../hooks/usePublishStanding'

const StatsContext = createContext<Stats | undefined>(undefined)

/**
 * Layout route that computes every attendance figure once and shares it.
 *
 * Home, Subjects, the subject detail screen and the nav dial all read the same
 * object, so there is exactly one Firestore listener and every number on screen
 * moves together the instant a class is marked.
 */
export function StatsProvider() {
  const stats = useComputeStats()
  // Publish the student's own leaderboard row from here, the one place that
  // already holds their computed numbers.
  usePublishStanding(stats.section, stats.overall)
  return (
    <StatsContext.Provider value={stats}>
      <Outlet />
    </StatsContext.Provider>
  )
}

export function useStats(): Stats {
  const ctx = useContext(StatsContext)
  if (!ctx) throw new Error('useStats must be used within a StatsProvider')
  return ctx
}
