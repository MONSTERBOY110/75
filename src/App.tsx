import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute, PublicOnlyRoute, SetupGate } from './components/auth/Guards'
import { AppLayout } from './components/layout/AppLayout'
import { StatsProvider } from './context/StatsContext'
import HomePage from './pages/HomePage'
import ProfilePage from './pages/ProfilePage'
import SetupPage from './pages/SetupPage'
import SignInPage from './pages/SignInPage'
import SignUpPage from './pages/SignUpPage'
import SubjectDetailPage from './pages/SubjectDetailPage'
import SubjectsPage from './pages/SubjectsPage'
import WelcomePage from './pages/WelcomePage'

export default function App() {
  return (
    <Routes>
      {/* Public auth screens - redirect away if already signed in */}
      <Route element={<PublicOnlyRoute />}>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/signup" element={<SignUpPage />} />
      </Route>

      {/* Authenticated area */}
      <Route element={<ProtectedRoute />}>
        <Route element={<SetupGate />}>
          <Route path="/setup" element={<SetupPage />} />
          {/* One attendance listener, shared by every screen below. */}
          <Route element={<StatsProvider />}>
            {/* Subject detail is full-screen with its own back header. */}
            <Route path="/subjects/:subjectId" element={<SubjectDetailPage />} />
            <Route element={<AppLayout />}>
              <Route path="/home" element={<HomePage />} />
              <Route path="/subjects" element={<SubjectsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
