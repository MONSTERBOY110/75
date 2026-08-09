import { NavLink } from 'react-router-dom'
import { BookOpen, User } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { band } from '../../lib/attendance'
import { useStats } from '../../context/StatsContext'
import { cn } from '../../utils/cn'
import { PercentTile } from '../attendance/PercentTile'

const SIDE_ITEMS: { to: string; label: string; icon: LucideIcon }[] = [
  { to: '/subjects', label: 'Subjects', icon: BookOpen },
  { to: '/profile', label: 'Profile', icon: User },
]

export function BottomNav() {
  const { overall } = useStats()
  const overallBand = band(overall.percent, overall.held)

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-app px-margin"
      style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
    >
      <div
        className="relative flex items-center justify-between border-2 border-outline bg-surface-container-high px-6 py-3"
        style={{ boxShadow: '5px 5px 0 0 #000' }}
      >
        {SIDE_ITEMS.map(({ to, label, icon: Icon }, i) => (
          <NavLink
            key={to}
            to={to}
            aria-label={label}
            className={({ isActive }) =>
              cn(
                'flex h-12 min-w-12 flex-col items-center justify-center gap-1 border-2 px-3 transition-colors',
                i === 0 ? 'mr-auto' : 'ml-auto',
                isActive
                  ? 'border-black bg-primary text-on-primary'
                  : 'border-transparent text-on-surface-variant',
              )
            }
          >
            <Icon className="h-5 w-5" strokeWidth={2.25} />
            <span className="font-pixel text-[7px] uppercase tracking-wider">{label}</span>
          </NavLink>
        ))}

        {/* Home sits raised in the middle, showing the number the app exists for. */}
        <NavLink
          to="/home"
          aria-label="Home"
          className="absolute left-1/2 top-0 flex items-center justify-center border-[3px] border-black bg-surface-container-lowest transition-[transform,box-shadow] duration-75"
          style={({ isActive }) => ({
            // Centred on the bar's top edge; the active tab presses into its shadow.
            transform: `translate(-50%, -50%) translate(${isActive ? '4px, 4px' : '0, 0'})`,
            boxShadow: isActive ? 'none' : '4px 4px 0 0 #1b7fa8',
          })}
        >
          <PercentTile percent={overall.percent} band={overallBand} />
        </NavLink>
      </div>
    </nav>
  )
}
