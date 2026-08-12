import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getSection, isBuiltInCollege, needsBatch } from '../../data/routines'
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
  // The batch check only applies to the built-in college, whose sections are the
  // ones that gained batches after people had already signed up.
  const setupDone =
    profile?.setupCompleted === true &&
    !(isBuiltInCollege(profile.collegeId) && needsBatch(getSection(profile.sectionId), profile.batch))

  const path = location.pathname
  // Building or editing a routine is reachable in both states: during setup it
  // hands the new routine back to /setup, and afterwards it is how a student
  // corrects one. /setup itself stays first-run only, since /routine covers
  // changing section later.
  const inSetupFlow = path === '/setup' || path === '/add-college' || path === '/routine'

  if (!setupDone && !inSetupFlow) return <Navigate to="/setup" replace />
  // Finishing setup lands on Home. Changing routine later happens at /routine.
  if (setupDone && path === '/setup') return <Navigate to="/home" replace />
  return <Outlet />
}

/** Redirects already-authenticated users away from the public auth screens. */
export function PublicOnlyRoute() {
  const { user, profile, loading } = useAuth()
  if (loading) return <FullScreenLoader />
  if (user) return <Navigate to={profile?.setupCompleted ? '/home' : '/setup'} replace />
  return <Outlet />
}
