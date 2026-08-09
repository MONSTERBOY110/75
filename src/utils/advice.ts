import type { Totals } from '../lib/attendance'

/**
 * The one line worth reading: what the numbers mean for what you do next.
 * Returns null when there is nothing useful to say yet.
 */
export function adviceFor(totals: Totals): string | null {
  if (totals.held <= 0) return null

  if (totals.percent < 75) {
    return totals.mustAttend === 1
      ? 'Attend the next class to reach 75%'
      : `Attend the next ${totals.mustAttend} to reach 75%`
  }

  if (totals.canSkip <= 0) return 'You are right on the line. Do not miss the next one.'
  return totals.canSkip === 1
    ? 'You can miss 1 more and stay at 75%'
    : `You can miss ${totals.canSkip} more and stay at 75%`
}

export function unmarkedNote(totals: Totals): string | null {
  if (totals.unmarked <= 0) return null
  return totals.unmarked === 1
    ? '1 class is still unmarked and counting against you'
    : `${totals.unmarked} classes are still unmarked and counting against you`
}

export function firstName(name: string | undefined | null): string {
  if (!name) return 'there'
  return name.trim().split(/\s+/)[0]
}
