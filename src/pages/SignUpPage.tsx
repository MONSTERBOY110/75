import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { GoogleIcon } from '../components/ui/GoogleIcon'
import { Input } from '../components/ui/Input'
import { ScreenHeader } from '../components/ui/ScreenHeader'
import { authErrorMessage, signInWithGoogle, signUpWithEmail } from '../services/auth'

export default function SignUpPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')

  // Year, semester and section are collected on the next screen (/setup).
  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Please enter your name.')
      return
    }
    if (password.length < 6) {
      setError('Password should be at least 6 characters.')
      return
    }

    setLoading(true)
    try {
      await signUpWithEmail(name.trim(), email.trim(), password)
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
      <ScreenHeader title="Create account" />

      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
        <Input
          label="Your name"
          name="name"
          autoComplete="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full name"
        />
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
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 6 characters"
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
          Continue
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
        Already have an account?{' '}
        <Link to="/signin" className="text-primary">
          Sign in
        </Link>
      </p>
    </div>
  )
}
