import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getSection, needsBatch } from '../../data/routines'
import { FullScreenLoader } from '../ui/Spinner'

/** Blocks unauthenticated users; sends them to the welcome screen. */
export function ProtectedRoute() {
  const { user, loading } = useAuth()
  if (loading) return <FullScreenLoader />
  if (!user) return <Navigate to="/" replace />
  return <Outlet />
}

/**
 * Enforces the first-time setup step. Assumes it is nested inside
 * ProtectedRoute, so a user always exists.
 */
export function SetupGate() {
  const { profile, loading } = useAuth()
  const location = useLocation()
  if (loading) return <FullScreenLoader />

  // A profile saved before its section gained lab batches is incomplete: without
  // a batch every lab would drop out of the totals, so send them back to setup.
  const setupDone =
    profile?.setupCompleted === true &&
    !needsBatch(getSection(profile.sectionId), profile.batch)
  const onSetup = location.pathname === '/setup'

  if (!setupDone && !onSetup) return <Navigate to="/setup" replace />
  if (setupDone && onSetup) return <Navigate to="/home" replace />
  return <Outlet />
}

/** Redirects already-authenticated users away from the public auth screens. */
export function PublicOnlyRoute() {
  const { user, profile, loading } = useAuth()
  if (loading) return <FullScreenLoader />
  if (user) return <Navigate to={profile?.setupCompleted ? '/home' : '/setup'} replace />
  return <Outlet />
}
