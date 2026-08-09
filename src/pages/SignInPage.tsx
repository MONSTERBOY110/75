import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { GoogleIcon } from '../components/ui/GoogleIcon'
import { Input } from '../components/ui/Input'
import { ScreenHeader } from '../components/ui/ScreenHeader'
import { authErrorMessage, signInWithEmail, signInWithGoogle } from '../services/auth'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')

  // Guards route to /home or /setup once auth state propagates.
  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signInWithEmail(email.trim(), password)
    } catch (err) {
      const msg = authErrorMessage(err)
      if (msg) setError(msg)
      setLoading(false)
    }
  }

  async function onGoogle() {
    setError('')
    setGoogleLoading(true)
    try {
      await signInWithGoogle()
    } catch (err) {
      const msg = authErrorMessage(err)
      if (msg) setError(msg)
      setGoogleLoading(false)
    }
  }

  return (
    <div className="app-shell px-margin pb-10 pt-3">
      <ScreenHeader title="Sign in" />

      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
        <Input
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@college.edu"
        />
        <Input
          label="Password"
          name="password"
          type={visible ? 'text' : 'password'}
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••"
          trailing={
            <button
              type="button"
              aria-label={visible ? 'Hide password' : 'Show password'}
              onClick={() => setVisible((v) => !v)}
              className="text-on-surface-variant transition-opacity active:opacity-60"
            >
              {visible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          }
        />

        {error && <p className="text-body-sm text-error">{error}</p>}

        <Button type="submit" loading={loading} className="mt-2">
          Sign in
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-outline-variant" />
        <span className="font-pixel text-[8px] uppercase tracking-wider text-on-surface-variant">
          or
        </span>
        <div className="h-px flex-1 bg-outline-variant" />
      </div>

      <Button variant="ghost" onClick={onGoogle} loading={googleLoading}>
        <GoogleIcon className="h-5 w-5" />
        Continue with Google
      </Button>

      <p className="mt-8 text-center text-body-sm text-on-surface-variant">
        New here?{' '}
        <Link to="/signup" className="text-primary">
          Create an account
        </Link>
      </p>
    </div>
  )
}
