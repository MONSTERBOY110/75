import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { band, type SubjectStat } from '../../lib/attendance'
import { getSubject } from '../../data/subjects'
import { BAND_TEXT } from '../../utils/band'
import { cn } from '../../utils/cn'
import { PixelBar } from './PixelBar'

/** One subject "tab": name and code on the left, X of Y on the right. */
export function SubjectRow({ stat }: { stat: SubjectStat }) {
  const subject = getSubject(stat.subjectId)
  const b = band(stat.percent, stat.held)

  return (
    <Link
      to={`/subjects/${subject.id}`}
      className="press block border-2 border-outline bg-surface-container p-4"
      style={{ boxShadow: '4px 4px 0 0 #000' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-body-lg text-on-surface">{subject.name}</p>
          <p className="mt-0.5 font-pixel text-[8px] uppercase tracking-wider text-on-surface-variant">
            {subject.code}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="text-right">
            <p className="text-body-lg leading-none">
              <span className="text-on-surface">{stat.attended}</span>
              <span className="text-on-surface-variant"> / {stat.held}</span>
            </p>
            <p className={cn('mt-1 text-body-sm leading-none', BAND_TEXT[b])}>
              {Math.round(stat.percent)}%
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-on-surface-variant" />
        </div>
      </div>

      <PixelBar percent={stat.percent} band={b} cells={16} height={6} className="mt-3" />
    </Link>
  )
}
