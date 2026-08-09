import type { LogEntry, LogStatus } from '../../lib/attendance'
import { cn } from '../../utils/cn'
import { formatDate, formatTime, isoWeekday, WEEKDAY_LABELS } from '../../utils/date'
import { MarkButtons } from './MarkButtons'
import type { AttendanceStatus } from '../../types'

const STATUS_CHIP: Record<LogStatus, { label: string; className: string }> = {
  attended: { label: 'Present', className: 'border-primary bg-primary/15 text-primary' },
  absent: { label: 'Absent', className: 'border-secondary bg-secondary/15 text-secondary' },
  notHeld: { label: 'No class', className: 'border-outline bg-surface-bright/20 text-on-surface-variant' },
  unmarked: { label: 'Unmarked', className: 'border-warning bg-warning/10 text-warning' },
}

/** One dated class in a subject's history. Tapping it reveals the mark controls. */
export function LogRow({
  entry,
  expanded,
  busy,
  onToggle,
  onMark,
}: {
  entry: LogEntry
  expanded: boolean
  busy: boolean
  onToggle: () => void
  onMark: (status: AttendanceStatus | null) => void
}) {
  const chip = STATUS_CHIP[entry.status]

  return (
    <div className="border-2 border-outline bg-surface-container" style={{ boxShadow: '4px 4px 0 0 #000' }}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between gap-3 p-4 text-left"
      >
        <div className="min-w-0">
          <p className="text-body-lg text-on-surface">{formatDate(entry.date)}</p>
          <p className="mt-0.5 font-pixel text-[8px] uppercase tracking-wider text-on-surface-variant">
            {WEEKDAY_LABELS[isoWeekday(entry.date) - 1]} · {formatTime(entry.start)}
          </p>
        </div>
        <span className={cn('chip shrink-0', chip.className)}>{chip.label}</span>
      </button>

      {expanded && (
        <div className="border-t-2 border-outline-variant p-4 pt-3">
          <MarkButtons value={entry.status} busy={busy} onMark={onMark} />
        </div>
      )}
    </div>
  )
}
