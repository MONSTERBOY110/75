import { band } from '../../lib/attendance'
import type { RankedStanding } from '../../lib/leaderboard'
import { Avatar } from '../ui/Avatar'
import { BAND_TEXT } from '../../utils/band'
import { cn } from '../../utils/cn'

/** Podium order: second, first, third. Heights follow. */
const PLACES = [1, 0, 2] as const
const HEIGHTS = ['h-16', 'h-24', 'h-12'] as const

function Plinth({
  standing,
  place,
  isMe,
}: {
  standing: RankedStanding
  place: 0 | 1 | 2
  isMe: boolean
}) {
  const b = band(standing.percent, standing.held)
  const first = place === 0

  return (
    // Capped so a college with one or two students still reads as a podium
    // rather than a full-width banner.
    <div className="flex min-w-0 max-w-[116px] flex-1 flex-col items-center">
      <Avatar
        photoURL={standing.photoURL}
        style={standing.avatarStyle}
        name={standing.name}
        size={first ? 'md' : 'sm'}
        className={cn(first ? 'border-primary' : 'border-outline', isMe && 'border-primary')}
      />

      <p
        className={cn(
          'mt-2 w-full truncate px-1 text-center text-body-sm',
          isMe ? 'text-primary' : 'text-on-surface',
        )}
      >
        {isMe ? 'You' : standing.name}
      </p>

      <p className={cn('text-body-lg leading-none', BAND_TEXT[b])}>
        {Math.round(standing.percent)}%
      </p>

      {/* The plinth itself: taller for first place, hard-edged like everything else. */}
      <div
        className={cn(
          'mt-2 flex w-full items-start justify-center border-2 pt-2',
          HEIGHTS[place],
          first ? 'border-black bg-primary' : 'border-outline bg-surface-container-high',
        )}
        style={{ boxShadow: first ? '4px 4px 0 0 #1b7fa8' : '4px 4px 0 0 #000' }}
      >
        <span
          className={cn(
            'font-pixel text-[16px]',
            first ? 'text-on-primary' : 'text-on-surface-variant',
          )}
        >
          {standing.rank}
        </span>
      </div>
    </div>
  )
}

export function Podium({ podium, myUid }: { podium: RankedStanding[]; myUid?: string }) {
  // With one or two students there is no podium to speak of, so centre them.
  const order = PLACES.filter((i) => podium[i] !== undefined)

  return (
    <div className="flex items-end justify-center gap-2">
      {order.map((i) => (
        <Plinth
          key={podium[i].uid}
          standing={podium[i]}
          place={i}
          isMe={podium[i].uid === myUid}
        />
      ))}
    </div>
  )
}
