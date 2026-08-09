import type { Band } from '../../lib/attendance'
import { BAND_FILL, BAND_HEX } from '../../utils/band'
import { cn } from '../../utils/cn'

const CELLS = 5

/**
 * The bottom-nav readout: a square pixel meter, not a dial. Big percentage over
 * a five-cell bar, so it matches the hard-edged boxes everywhere else.
 */
export function PercentTile({
  percent,
  band,
  size = 58,
}: {
  percent: number
  band: Band
  size?: number
}) {
  const filled = percent <= 0 ? 0 : Math.min(CELLS, Math.max(1, Math.round((percent / 100) * CELLS)))

  return (
    <div
      className="flex flex-col items-center justify-center gap-[5px] bg-surface-container-lowest"
      style={{ width: size, height: size }}
    >
      <div className="flex items-baseline gap-[1px]">
        <span className="text-[24px] leading-none" style={{ color: BAND_HEX[band] }}>
          {Math.round(percent)}
        </span>
        <span className="text-[11px] leading-none text-on-surface-variant">%</span>
      </div>

      <div className="flex gap-[2px]" style={{ width: size - 18 }}>
        {Array.from({ length: CELLS }, (_, i) => (
          <span
            key={i}
            className={cn('h-[4px] flex-1', i < filled ? BAND_FILL[band] : 'bg-outline-variant')}
          />
        ))}
      </div>
    </div>
  )
}
