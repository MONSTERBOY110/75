import { band } from '../../lib/attendance'
import { PLINTH_HEIGHTS, PODIUM_ORDER, type RankedStanding } from '../../lib/leaderboard'
import { Avatar } from '../ui/Avatar'
import { BAND_TEXT } from '../../utils/band'
import { cn } from '../../utils/cn'

function Plinth({
  standing,
  rankIndex,
  isMe,
}: {
  standing: RankedStanding
  /** 0 for first place, 1 for second, 2 for third. Drives every size here. */
  rankIndex: 0 | 1 | 2
  isMe: boolean
}) {
  const b = band(standing.percent, standing.held)
  const first = rankIndex === 0

  return (
    // First place gets the wider column as well as the taller plinth. Capped so
    // a college with one or two students still reads as a podium, not a banner.
    <div
      className={cn(
        'flex min-w-0 flex-col items-center',
        first ? 'max-w-[132px] flex-[1.25]' : 'max-w-[104px] flex-1',
      )}
    >
      <Avatar
        photoURL={standing.photoURL}
        style={standing.avatarStyle}
        name={standing.name}
        size={first ? 'md' : 'sm'}
        className={cn(first ? 'border-primary' : 'border-outline', isMe && 'border-primary')}
      />

      <p
        className={cn(
          'mt-2 w-full truncate px-1 text-center',
          first ? 'text-body-lg' : 'text-body-sm',
          isMe ? 'text-primary' : 'text-on-surface',
        )}
      >
        {isMe ? 'You' : standing.name}
      </p>

      <p className={cn('leading-none', first ? 'text-title-md' : 'text-body-lg', BAND_TEXT[b])}>
        {Math.round(standing.percent)}%
      </p>

      {/* The plinth: height comes from the rank, so first always stands tallest. */}
      <div
        className={cn(
          'mt-2 flex w-full items-start justify-center border-2 pt-2',
          first ? 'border-black bg-primary' : 'border-outline bg-surface-container-high',
        )}
        style={{
          height: PLINTH_HEIGHTS[rankIndex],
          boxShadow: first ? '4px 4px 0 0 #1b7fa8' : '4px 4px 0 0 #000',
        }}
      >
        <span
          className={cn(
            'font-pixel',
            first ? 'text-[20px] text-on-primary' : 'text-[13px] text-on-surface-variant',
          )}
        >
          {standing.rank}
        </span>
      </div>
    </div>
  )
}

export function Podium({ podium, myUid }: { podium: RankedStanding[]; myUid?: string }) {
  // With one or two students there is no full podium, so show who is there.
  const order = PODIUM_ORDER.filter((rankIndex) => podium[rankIndex] !== undefined)

  return (
    <div className="flex items-end justify-center gap-2">
      {order.map((rankIndex) => (
        <Plinth
          key={podium[rankIndex].uid}
          standing={podium[rankIndex]}
          rankIndex={rankIndex}
          isMe={podium[rankIndex].uid === myUid}
        />
      ))}
    </div>
  )
}
