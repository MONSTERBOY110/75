import { Link } from 'react-router-dom'
import { Logo } from '../components/ui/Logo'

export default function WelcomePage() {
  return (
    <div className="app-shell justify-between px-margin pb-10 pt-16">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <Logo size={88} />
        <h1 className="wordmark mt-8 text-[56px] leading-none">75</h1>
        <p className="mt-5 text-body-lg text-on-surface">Stay above the line.</p>
        <p className="mt-1 max-w-[16rem] text-body-sm text-on-surface-variant">
          Mark every class. Watch your percentage. Never guess again.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <Link to="/signup" className="btn-primary w-full">
          Create account
        </Link>
        <Link to="/signin" className="btn-secondary w-full">
          I have an account
        </Link>
      </div>
    </div>
  )
}
