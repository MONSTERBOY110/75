import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { CalendarOff, ChevronDown, ChevronUp } from 'lucide-react'
import { WeekRow } from '../components/calendar/WeekRow'
import { ScreenHeader } from '../components/ui/ScreenHeader'
import { Spinner } from '../components/ui/Spinner'
import { useAuth } from '../context/AuthContext'
import { useStats } from '../context/StatsContext'
import { monthGrid, monthIndex, shiftMonth } from '../lib/calendar'
import { BAND_FILL } from '../utils/band'
import { cn } from '../utils/cn'
import { formatMonthYear } from '../utils/date'

/** Sunday first, like a wall calendar. */
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

const LEGEND = [
  { band: 'safe', label: '75%+' },
  { band: 'warn', label: '65-74%' },
  { band: 'danger', label: 'Below 65%' },
] as const

function MonthButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string
  disabled: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="press flex h-10 w-10 items-center justify-center border-2 border-outline bg-surface-container-high text-primary"
      style={{ boxShadow: '3px 3px 0 0 #000' }}
    >
      {children}
    </button>
  )
}

export default function CalendarPage() {
  const { profile } = useAuth()
  const stats = useStats()

  const today = new Date(stats.now)
  const [view, setView] = useState({ year: today.getFullYear(), month: today.getMonth() })

  // Browse from the month the semester started up to the current one: earlier
  // and later months have nothing to show.
  const semesterStart = profile?.semesterStartDate ? new Date(profile.semesterStartDate) : null
  const earliest = semesterStart
    ? monthIndex(semesterStart.getFullYear(), semesterStart.getMonth())
    : -Infinity
  const latest = monthIndex(today.getFullYear(), today.getMonth())
  const shown = monthIndex(view.year, view.month)

  const weeks = useMemo(
    () => monthGrid(view.year, view.month, stats.occurrences, stats.records, stats.now),
    [view.year, view.month, stats.occurrences, stats.records, stats.now],
  )

  return (
    <div className="app-shell px-margin pb-10 pt-3">
      <ScreenHeader title="Calendar" />

      <div className="card mt-5 px-3 pb-3 pt-4">
        <div className="flex items-center justify-between gap-3 px-1">
          <h2 className="text-title-md leading-none text-on-surface">
            {formatMonthYear(view.year, view.month).replace(' ', ', ')}
          </h2>
          <div className="flex gap-2">
            <MonthButton
              label="Previous month"
              disabled={shown <= earliest}
              onClick={() => setView((v) => shiftMonth(v.year, v.month, -1))}
            >
              <ChevronUp className="h-5 w-5" strokeWidth={3} />
            </MonthButton>
            <MonthButton
              label="Next month"
              disabled={shown >= latest}
              onClick={() => setView((v) => shiftMonth(v.year, v.month, 1))}
            >
              <ChevronDown className="h-5 w-5" strokeWidth={3} />
            </MonthButton>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-7">
          {WEEKDAYS.map((d) => (
            <span
              key={d}
              className="text-center font-pixel text-[8px] uppercase tracking-wider text-on-surface-variant"
            >
              {d}
            </span>
          ))}
        </div>

        {stats.loading ? (
          <div className="flex h-[312px] items-center justify-center">
            <Spinner />
          </div>
        ) : (
          <div className="mt-2 flex flex-col gap-1">
            {weeks.map((week) => (
              <WeekRow key={week.start} week={week} />
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
        {LEGEND.map((item) => (
          <span key={item.band} className="flex items-center gap-1.5">
            <span className={cn('h-3 w-3', BAND_FILL[item.band])} />
            <span className="text-body-sm text-on-surface-variant">{item.label}</span>
          </span>
        ))}
      </div>

      <Link to="/holidays" className="btn-ghost mt-7 w-full">
        <CalendarOff className="h-4 w-4" />
        Holidays
      </Link>
    </div>
  )
}
