import { useEffect, useState } from 'react'

/**
 * A timestamp that refreshes on an interval, so a screen left open crosses a
 * class start time (and rolls over midnight) without needing a reload.
 */
export function useNow(intervalMs = 60_000): number {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])

  return now
}
