import { band } from '../../lib/attendance'
import type { RankedStanding } from '../../lib/leaderboard'
import { Avatar } from '../ui/Avatar'
import { BAND_TEXT } from '../../utils/band'
import { cn } from '../../utils/cn'

/** One ranked student below the podium. */
export function StandingRow({
  standing,
  isMe,
}: {
  standing: RankedStanding
  isMe: boolean
}) {
  const b = band(standing.percent, standing.held)

  return (
    <div
      className={cn(
        'flex items-center gap-3 border-2 px-3 py-2',
        isMe ? 'border-primary bg-primary/10' : 'border-outline bg-surface-container',
      )}
      style={{ boxShadow: isMe ? '4px 4px 0 0 #1b7fa8' : '4px 4px 0 0 #000' }}
    >
      <span className="w-6 shrink-0 text-center font-pixel text-[10px] text-on-surface-variant">
        {standing.rank}
      </span>

      <Avatar
        photoURL={standing.photoURL}
        style={standing.avatarStyle}
        name={standing.name}
        size="sm"
        className="h-8 w-8"
      />

      <div className="min-w-0 flex-1">
        <p className={cn('truncate text-body-lg', isMe ? 'text-primary' : 'text-on-surface')}>
          {isMe ? 'You' : standing.name}
        </p>
        {standing.sectionLabel && (
          <p className="truncate font-pixel text-[8px] uppercase tracking-wider text-on-surface-variant">
            {standing.sectionLabel}
          </p>
        )}
      </div>

      <div className="shrink-0 text-right">
        <p className={cn('text-body-lg leading-none', BAND_TEXT[b])}>
          {Math.round(standing.percent)}%
        </p>
        <p className="mt-0.5 text-body-sm leading-none text-on-surface-variant">
          {standing.attended}/{standing.held}
        </p>
      </div>
    </div>
  )
}
