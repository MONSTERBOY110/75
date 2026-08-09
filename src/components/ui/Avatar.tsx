import type { AvatarStyle } from '../../types'
import { cn } from '../../utils/cn'
import { PixelAvatar } from './PixelAvatar'

const SIZES = {
  sm: 'h-10 w-10',
  md: 'h-12 w-12',
  lg: 'h-24 w-24',
} as const

/**
 * The student's face: their Google photo when they signed in with Google,
 * otherwise the pixel avatar they picked during setup. Photos inherit the
 * global `image-rendering: pixelated`, so both read 8-bit.
 */
export function Avatar({
  photoURL,
  style,
  name,
  size = 'md',
  className,
}: {
  photoURL?: string | null
  style?: AvatarStyle
  name?: string
  size?: keyof typeof SIZES
  className?: string
}) {
  return (
    <div
      className={cn(
        'shrink-0 overflow-hidden border-2 border-outline bg-surface-container-high',
        SIZES[size],
        className,
      )}
    >
      {photoURL ? (
        <img
          src={photoURL}
          alt={name ? `${name}'s profile picture` : 'Profile picture'}
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        <PixelAvatar style={style} />
      )}
    </div>
  )
}
