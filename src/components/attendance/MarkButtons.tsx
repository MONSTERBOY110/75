import type { LogStatus } from '../../lib/attendance'
import type { AttendanceStatus } from '../../types'
import { cn } from '../../utils/cn'

const OPTIONS: { status: AttendanceStatus; label: string; on: string; shadow: string }[] = [
  { status: 'attended', label: 'Present', on: 'border-black bg-primary text-on-primary', shadow: '#1b7fa8' },
  { status: 'absent', label: 'Absent', on: 'border-black bg-secondary text-on-secondary', shadow: '#7a1a10' },
  { status: 'notHeld', label: 'No class', on: 'border-black bg-surface-bright text-on-surface', shadow: '#000' },
]

/**
 * Three-way mark for one class. Tapping the option that is already selected
 * clears the mark, so a mis-tap is one tap to undo.
 */
export function MarkButtons({
  value,
  onMark,
  busy = false,
  className,
}: {
  value: LogStatus
  onMark: (status: AttendanceStatus | null) => void
  busy?: boolean
  className?: string
}) {
  return (
    <div className={cn('grid grid-cols-3 gap-2', className)}>
      {OPTIONS.map(({ status, label, on, shadow }) => {
        const active = value === status
        return (
          <button
            key={status}
            type="button"
            disabled={busy}
            aria-pressed={active}
            onClick={() => onMark(active ? null : status)}
            className={cn(
              'press flex h-10 items-center justify-center border-2 px-1 font-pixel text-[8px] uppercase tracking-wider',
              active ? on : 'border-outline bg-surface-container-high text-on-surface-variant',
            )}
            style={{ boxShadow: active ? `3px 3px 0 0 ${shadow}` : '3px 3px 0 0 #000' }}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
