import { describe, it, expect } from 'vitest'
import { pixelRingClip, pixelRoundedClip, steppedRectPoints } from './pixelShape'

describe('steppedRectPoints', () => {
  it('cuts every corner two stairs deep, so 20 points in all', () => {
    expect(steppedRectPoints(0, 3)).toHaveLength(20)
  })

  it('starts two steps in from the left along the top edge', () => {
    expect(steppedRectPoints(0, 3)[0]).toBe('6px 0px')
  })

  it('shifts every point inwards by the inset', () => {
    expect(steppedRectPoints(3, 3)[0]).toBe('9px 3px')
    expect(steppedRectPoints(3, 3)[6]).toBe('calc(100% - 3px) calc(100% - 9px)')
  })
})

describe('clip paths', () => {
  it('draws the fill as one closed stepped polygon', () => {
    const clip = pixelRoundedClip(3)
    expect(clip.startsWith('polygon(')).toBe(true)
    expect(clip).not.toContain('evenodd')
  })

  it('draws the outline as a ring, so the fill inside can stay translucent', () => {
    const ring = pixelRingClip(3, 3)
    expect(ring.startsWith('polygon(evenodd, ')).toBe(true)
    // Outer loop, a seam back to its start, the inner loop, a seam back to its start.
    expect(ring.split(', ').length - 1).toBe(20 + 1 + 20 + 1)
  })
})
