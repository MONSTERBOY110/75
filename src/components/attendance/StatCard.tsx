import { band, type Totals } from '../../lib/attendance'
import { adviceFor } from '../../utils/advice'
import { BAND_TEXT } from '../../utils/band'
import { cn } from '../../utils/cn'
import { PixelBar } from './PixelBar'

/** The headline figure on Home. */
export function StatHero({ label, totals }: { label: string; totals: Totals }) {
  const b = band(totals.percent, totals.held)
  const advice = adviceFor(totals)

  return (
    <div className="card p-5">
      <span className="text-label-caps uppercase text-on-surface-variant">{label}</span>

      <div className="mt-2 flex items-baseline gap-1">
        <span className={cn('text-display-lg', BAND_TEXT[b])}>{Math.round(totals.percent)}</span>
        <span className={cn('text-title-md', BAND_TEXT[b])}>%</span>
        <span className="ml-auto text-body-lg text-on-surface-variant">
          <span className="text-on-surface">{totals.attended}</span> / {totals.held}
        </span>
      </div>

      <PixelBar percent={totals.percent} band={b} className="mt-3" />

      <p className="mt-3 text-body-sm text-on-surface-variant">
        {advice ?? 'No classes held yet this semester'}
      </p>
    </div>
  )
}

/** The Theory / Practical pair below the hero. */
export function StatTile({ label, totals }: { label: string; totals: Totals }) {
  const b = band(totals.percent, totals.held)

  return (
    <div className="card p-4">
      <span className="text-label-caps uppercase text-on-surface-variant">{label}</span>
      <div className="mt-1 flex items-baseline gap-1">
        <span className={cn('text-headline-mobile', BAND_TEXT[b])}>
          {Math.round(totals.percent)}
        </span>
        <span className={cn('text-body-lg', BAND_TEXT[b])}>%</span>
      </div>
      <PixelBar percent={totals.percent} band={b} cells={10} height={8} className="mt-2" />
      <p className="mt-2 text-body-sm text-on-surface-variant">
        {totals.attended} of {totals.held} classes
      </p>
    </div>
  )
}
