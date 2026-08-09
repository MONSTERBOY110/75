import type { AvatarStyle } from '../../types'
import { cn } from '../../utils/cn'

/**
 * Hand-plotted 8-bit avatars on a 12x12 grid. Two silhouettes - short hair and
 * long hair - drawn in the accent colour so they sit inside the theme rather
 * than importing a cartoon from somewhere else.
 */

type Cell = [x: number, y: number, w?: number, h?: number]

const FACE: Cell[] = [[3, 3, 6, 6]]
const NECK: Cell[] = [[5, 9, 2, 1]]
const SHOULDERS: Cell[] = [[2, 10, 8, 2]]

const HAIR: Record<AvatarStyle, Cell[]> = {
  // Cropped: a cap of hair across the crown with short sideburns.
  boy: [
    [3, 1, 6, 2],
    [2, 2, 1, 2],
    [9, 2, 1, 2],
  ],
  // Long: the same crown, with hair falling past the jaw on both sides.
  girl: [
    [3, 1, 6, 2],
    [2, 2, 1, 8],
    [9, 2, 1, 8],
  ],
}

const EYES: Cell[] = [
  [4, 5, 1, 1],
  [7, 5, 1, 1],
]
const MOUTH: Cell[] = [[5, 7, 2, 1]]

function Rects({ cells, fill }: { cells: Cell[]; fill: string }) {
  return (
    <>
      {cells.map(([x, y, w = 1, h = 1], i) => (
        <rect key={i} x={x} y={y} width={w} height={h} fill={fill} />
      ))}
    </>
  )
}

export function PixelAvatar({
  style = 'boy',
  className,
}: {
  style?: AvatarStyle
  className?: string
}) {
  return (
    <svg
      viewBox="0 0 12 12"
      className={cn('h-full w-full', className)}
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      <Rects cells={FACE} fill="#2a2a2a" />
      <Rects cells={NECK} fill="#2a2a2a" />
      <Rects cells={SHOULDERS} fill="#1b7fa8" />
      <Rects cells={HAIR[style]} fill="#38bdf8" />
      <Rects cells={EYES} fill="#f5f5f5" />
      <Rects cells={MOUTH} fill="#9a9a9a" />
    </svg>
  )
}
