import type { Band } from '../../lib/attendance'
import { BAND_FILL } from '../../utils/band'
import { cn } from '../../utils/cn'

/**
 * A blocky segmented progress bar - the arcade health-bar read, not a smooth
 * rounded track. Rounds up so any progress at all lights at least one cell.
 */
export function PixelBar({
  percent,
  band,
  cells = 20,
  height = 12,
  className,
}: {
  percent: number
  band: Band
  cells?: number
  height?: number
  className?: string
}) {
  const filled = percent <= 0 ? 0 : Math.min(cells, Math.max(1, Math.round((percent / 100) * cells)))

  return (
    <div
      className={cn('flex w-full gap-[2px]', className)}
      role="img"
      aria-label={`${Math.round(percent)} percent`}
    >
      {Array.from({ length: cells }, (_, i) => (
        <span
          key={i}
          style={{ height }}
          className={cn('flex-1', i < filled ? BAND_FILL[band] : 'bg-outline-variant')}
        />
      ))}
    </div>
  )
}
