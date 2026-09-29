import { band } from '../../lib/attendance'
import type { CalendarWeek } from '../../lib/calendar'
import { BAND_FILL, BAND_TEXT } from '../../utils/band'
import { cn } from '../../utils/cn'
import { pixelRingClip, pixelRoundedClip } from '../../utils/pixelShape'

/** 3px stairs and a 3px outline: chunky enough to read as pixels on a phone. */
const FILL_CLIP = pixelRoundedClip(3)
const RING_CLIP = pixelRingClip(3, 3)

/**
 * One Sunday-to-Saturday row of the month view.
 *
 * When the week has something to report, a translucent box covers Monday to
 * Saturday - the college days - and the week's attendance sits on top, with the
 * dates still readable underneath at roughly a third of their strength. Sunday is
 * left outside the box. Weeks with nothing to report (before the semester, or
 * still to come) show their dates plainly.
 */
export function WeekRow({ week }: { week: CalendarWeek }) {
  const covered = week.state !== 'none'
  const b = band(week.totals.percent, week.totals.held)

  return (
    <div className="relative grid h-[52px] grid-cols-7">
      {week.days.map((d) => (
        <div key={d.dateKey} className="flex items-center justify-center">
          <span
            aria-current={d.isToday ? 'date' : undefined}
            className={cn(
              'flex h-9 w-9 items-center justify-center text-body-lg leading-none',
              // Today sits above the week's box so it stays bright, as on a wall calendar.
              d.isToday
                ? 'relative z-10 border-2 border-black bg-primary text-on-primary'
                : d.inMonth
                  ? 'text-on-surface'
                  : 'text-on-surface-variant/40',
            )}
            style={d.isToday ? { boxShadow: '2px 2px 0 0 #1b7fa8' } : undefined}
          >
            {d.day}
          </span>
        </div>
      ))}

      {covered && (
        // Starts one column in, so Sunday stays outside.
        <div className="absolute inset-y-1 right-0.5" style={{ left: 'calc(100% / 7)' }}>
          {/* ~65% opaque, so the dates beneath show through at about 35%. */}
          <div className="absolute inset-0 bg-background/65" style={{ clipPath: FILL_CLIP }} />
          {/* The outline: a stair-stepped ring, so the corners read as rounded
              pixel art rather than a smooth curve. */}
          <div
            className={cn(
              'absolute inset-0',
              week.state === 'held' ? BAND_FILL[b] : 'bg-outline',
            )}
            style={{ clipPath: RING_CLIP }}
          />

          <div className="relative flex h-full items-center justify-center gap-2.5">
            {week.state === 'held' ? (
              <>
                <span
                  className={cn('text-title-md leading-none', BAND_TEXT[b])}
                  style={{ textShadow: '2px 2px 0 #000' }}
                >
                  {Math.round(week.totals.percent)}%
                </span>
                <span className="font-pixel text-[8px] uppercase tracking-wider text-on-surface">
                  {week.totals.attended}/{week.totals.held}
                </span>
              </>
            ) : (
              <span className="font-pixel text-[8px] uppercase tracking-wider text-on-surface-variant">
                No classes held
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
