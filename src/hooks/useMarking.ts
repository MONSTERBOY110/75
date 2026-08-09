import { useCallback, useState } from 'react'
import { useUid } from '../context/AuthContext'
import { recordKey } from '../lib/attendance'
import { clearMark, markAttendance, markDayNotHeld, type MarkInput } from '../services/attendance'
import type { AttendanceStatus } from '../types'

export type MarkTarget = Omit<MarkInput, 'status'>

/**
 * Writes marks and tracks which one is in flight, so a single row can show a
 * pending state without freezing the whole screen.
 */
export function useMarking() {
  const uid = useUid()
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [error, setError] = useState('')

  const mark = useCallback(
    async (target: MarkTarget, status: AttendanceStatus | null) => {
      const key = recordKey(target.dateKey, target.slotId)
      setBusyKey(key)
      setError('')
      try {
        if (status === null) await clearMark(uid, target.dateKey, target.slotId)
        else await markAttendance(uid, { ...target, status })
      } catch {
        setError('Could not save that. Check your connection and try again.')
      } finally {
        setBusyKey(null)
      }
    },
    [uid],
  )

  const markAllNotHeld = useCallback(
    async (targets: MarkTarget[]) => {
      setBusyKey('__day__')
      setError('')
      try {
        await markDayNotHeld(uid, targets)
      } catch {
        setError('Could not save that. Check your connection and try again.')
      } finally {
        setBusyKey(null)
      }
    },
    [uid],
  )

  return { mark, markAllNotHeld, busyKey, error }
}
