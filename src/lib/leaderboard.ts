import type { Standing } from '../types'

/** How many students the podium shows. */
export const PODIUM_SIZE = 3
/** How many ranked rows follow the podium. */
export const LIST_SIZE = 12
export const BOARD_SIZE = PODIUM_SIZE + LIST_SIZE

export interface RankedStanding extends Standing {
  /** 1-based. Students level on both percent and classes held share a rank. */
  rank: number
}

export interface Board {
  /** Up to three, in podium order: 1st, 2nd, 3rd. */
  podium: RankedStanding[]
  /** The next twelve, ranks 4 onwards. */
  rest: RankedStanding[]
  /** Where the signed-in student sits, even if that is outside the board. */
  me: RankedStanding | null
  /** True when the student is ranked below the last visible row. */
  meBelowBoard: boolean
  total: number
}

/**
 * Orders a college's students and slices them into a podium and a list.
 *
 * Ranking is by attendance percentage, then by classes held so that someone at
 * 100% off a single class does not outrank someone who has held their percentage
 * across a whole semester, then by name so the order is stable.
 */
export function rankStandings(standings: Standing[], myUid?: string): Board {
  const sorted = [...standings].sort(
    (a, b) => b.percent - a.percent || b.held - a.held || a.name.localeCompare(b.name),
  )

  const ranked: RankedStanding[] = []
  for (let i = 0; i < sorted.length; i++) {
    const prev = ranked[i - 1]
    const s = sorted[i]
    // Genuine ties share a rank; the next student still takes their ordinal.
    const tied = prev && prev.percent === s.percent && prev.held === s.held
    ranked.push({ ...s, rank: tied ? prev.rank : i + 1 })
  }

  const me = ranked.find((s) => s.uid === myUid) ?? null

  return {
    podium: ranked.slice(0, PODIUM_SIZE),
    rest: ranked.slice(PODIUM_SIZE, BOARD_SIZE),
    me,
    meBelowBoard: Boolean(me) && ranked.indexOf(me!) >= BOARD_SIZE,
    total: ranked.length,
  }
}

/** "4th", "1st", "23rd" - used in the Home card. */
export function ordinal(n: number): string {
  const mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`
  switch (n % 10) {
    case 1:
      return `${n}st`
    case 2:
      return `${n}nd`
    case 3:
      return `${n}rd`
    default:
      return `${n}th`
  }
}
