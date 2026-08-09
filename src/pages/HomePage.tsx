import { Link } from 'react-router-dom'
import { AlertTriangle, ChevronRight } from 'lucide-react'
import { StatHero, StatTile } from '../components/attendance/StatCard'
import { Avatar } from '../components/ui/Avatar'
import { Spinner } from '../components/ui/Spinner'
import { useAuth } from '../context/AuthContext'
import { getSection } from '../data/routines'
import { useStats } from '../context/StatsContext'
import { firstName, unmarkedNote } from '../utils/advice'
import { formatDayAndDate } from '../utils/date'

export default function HomePage() {
  const { profile } = useAuth()
  const stats = useStats()
  const { overall, theory, practical, todaySlots, todayDate, loading } = stats
  const section = getSection(profile?.sectionId)
  const nudge = unmarkedNote(overall)

  return (
    <div>
      <div className="flex h-12 items-center justify-between">
        <span className="wordmark text-[15px]">75</span>
        <Link to="/profile" aria-label="Profile">
          <Avatar
            photoURL={profile?.photoURL}
            style={profile?.avatarStyle}
            name={profile?.name}
            size="sm"
          />
        </Link>
      </div>

      <h1 className="mt-2 text-headline-mobile text-on-surface">
        Hello, {firstName(profile?.name)}
      </h1>
      <p className="mt-1 text-body-lg text-on-surface-variant">
        {section ? `${section.label} · Sem ${section.semester}` : 'Your attendance so far'}
      </p>

      {loading ? (
        <div className="mt-10 flex justify-center">
          <Spinner />
        </div>
      ) : (
        <>
          <div className="mt-6">
            <StatHero label="Overall attendance" totals={overall} />
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <StatTile label="Theory" totals={theory} />
            <StatTile label="Practical" totals={practical} />
          </div>

          {nudge && (
            <div className="mt-4 flex items-start gap-2 border-2 border-warning/40 bg-warning/10 px-4 py-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
              <p className="text-body-sm text-warning">{nudge}</p>
            </div>
          )}

          <Link
            to="/subjects"
            className="press mt-4 flex items-center justify-between border-2 border-outline bg-surface-container p-4"
            style={{ boxShadow: '4px 4px 0 0 #000' }}
          >
            <div>
              <p className="text-body-lg text-on-surface">
                {todaySlots.length === 0
                  ? 'No classes today'
                  : `${todaySlots.length} ${todaySlots.length === 1 ? 'class' : 'classes'} today`}
              </p>
              <p className="mt-0.5 font-pixel text-[8px] uppercase tracking-wider text-on-surface-variant">
                {formatDayAndDate(todayDate)}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-primary" />
          </Link>
        </>
      )}
    </div>
  )
}
