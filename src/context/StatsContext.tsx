import { createContext, useContext } from 'react'
import { Outlet } from 'react-router-dom'
import { useComputeStats, type Stats } from '../hooks/useStats'

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
