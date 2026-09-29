/**
 * Stair-stepped "rounded" corners, drawn as clip-paths.
 *
 * A smooth border-radius would break the pixel theme, and an ordinary CSS border
 * cannot follow a staircase. So a box gets two layers: a fill clipped to a
 * stepped rectangle, and an outline clipped to a stepped ring (the same shape
 * with a smaller copy cut out using the even-odd rule). Keeping the outline a
 * ring - rather than a solid layer behind the fill - is what lets the fill stay
 * translucent without the outline colour bleeding through it.
 */

type Edge = 'start' | 'end'

function coord(edge: Edge, offset: number): string {
  return edge === 'start' ? `${offset}px` : `calc(100% - ${offset}px)`
}

/**
 * The 20 points of a rectangle inset by `inset` px, with each corner cut two
 * `step`-px stairs deep, listed clockwise from the top edge.
 */
export function steppedRectPoints(inset: number, step: number): string[] {
  const a = inset
  const s1 = inset + step
  const s2 = inset + 2 * step

  const points: [Edge, number, Edge, number][] = [
    // top edge, then the top-right staircase
    ['start', s2, 'start', a],
    ['end', s2, 'start', a],
    ['end', s2, 'start', s1],
    ['end', s1, 'start', s1],
    ['end', s1, 'start', s2],
    ['end', a, 'start', s2],
    // right edge, then bottom-right
    ['end', a, 'end', s2],
    ['end', s1, 'end', s2],
    ['end', s1, 'end', s1],
    ['end', s2, 'end', s1],
    ['end', s2, 'end', a],
    // bottom edge, then bottom-left
    ['start', s2, 'end', a],
    ['start', s2, 'end', s1],
    ['start', s1, 'end', s1],
    ['start', s1, 'end', s2],
    ['start', a, 'end', s2],
    // left edge, then top-left
    ['start', a, 'start', s2],
    ['start', s1, 'start', s2],
    ['start', s1, 'start', s1],
    ['start', s2, 'start', s1],
  ]

  return points.map(([xEdge, x, yEdge, y]) => `${coord(xEdge, x)} ${coord(yEdge, y)}`)
}

/** Clip-path for the fill of a pixel-rounded box. */
export function pixelRoundedClip(step = 3): string {
  return `polygon(${steppedRectPoints(0, step).join(', ')})`
}

/**
 * Clip-path for the outline of a pixel-rounded box: the outer shape with an
 * inner copy `thickness` px in cut out. The two loops are joined by a
 * zero-width seam, which even-odd filling ignores.
 */
export function pixelRingClip(step = 3, thickness = 3): string {
  const outer = steppedRectPoints(0, step)
  const inner = steppedRectPoints(thickness, step)
  return `polygon(evenodd, ${[...outer, outer[0], ...inner, inner[0]].join(', ')})`
}
