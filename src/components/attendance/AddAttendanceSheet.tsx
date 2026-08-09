import { useEffect, useMemo, useState } from 'react'
import { X } from 'lucide-react'
import { recordKey, type LogStatus } from '../../lib/attendance'
import { useMarking } from '../../hooks/useMarking'
import type { AttendanceRecord, Slot, Subject } from '../../types'
import { cn } from '../../utils/cn'
import { formatTime, fromDateKey, isoWeekday, minutesOfDay, toDateKey } from '../../utils/date'
import { MarkButtons } from './MarkButtons'

/**
 * Back-fill sheet: pick any past date and mark the class you forgot. Only dates
 * inside the semester are accepted, and only slots the routine actually puts on
 * that weekday can be marked - you can't invent a class that never existed.
 */
export function AddAttendanceSheet({
  open,
  subject,
  slots,
  records,
  semesterStart,
  onClose,
}: {
  open: boolean
  subject: Subject
  /** The routine slots that teach this subject. */
  slots: Slot[]
  records: AttendanceRecord[]
  semesterStart: number
  onClose: () => void
}) {
  const todayKey = toDateKey(Date.now())
  const [dateKey, setDateKey] = useState(todayKey)
  const { mark, busyKey, error } = useMarking()

  useEffect(() => {
    if (open) setDateKey(todayKey)
  }, [open, todayKey])

  useEffect(() => {
    if (!open) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  const chosenMs = fromDateKey(dateKey)
  const matching = useMemo(() => {
    if (!Number.isFinite(chosenMs)) return []
    const weekday = isoWeekday(chosenMs)
    return slots
      .filter((slot) => slot.day === weekday)
      .sort((a, b) => minutesOfDay(a.start) - minutesOfDay(b.start))
  }, [chosenMs, slots])

  if (!open) return null

  const beforeSemester = Number.isFinite(chosenMs) && chosenMs < semesterStart

  const statusOf = (slotId: string): LogStatus =>
    records.find((r) => r.dateKey === dateKey && r.slotId === slotId)?.status ?? 'unmarked'

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Add attendance for ${subject.name}`}
        className="w-full max-w-app border-t-2 border-outline bg-surface-container p-5"
        style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-pixel text-[11px] uppercase tracking-wider text-primary">
              Add attendance
            </h2>
            <p className="mt-2 truncate text-body-lg text-on-surface">{subject.name}</p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="text-on-surface-variant transition-opacity active:opacity-60"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <label htmlFor="backfill-date" className="field-label mt-5">
          Which day?
        </label>
        <input
          id="backfill-date"
          type="date"
          className="input"
          min={toDateKey(semesterStart)}
          max={todayKey}
          value={dateKey}
          onChange={(e) => setDateKey(e.target.value)}
        />

        <div className="mt-5">
          {beforeSemester ? (
            <p className="text-body-sm text-on-surface-variant">
              That date is before your semester started.
            </p>
          ) : matching.length === 0 ? (
            <p className="text-body-sm text-on-surface-variant">
              No {subject.short} class on that day.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {matching.map((slot) => (
                <div key={slot.id}>
                  <p className="mb-2 text-body-sm text-on-surface-variant">
                    {formatTime(slot.start)} to {formatTime(slot.end)}
                  </p>
                  <MarkButtons
                    value={statusOf(slot.id)}
                    busy={busyKey === recordKey(dateKey, slot.id)}
                    onMark={(status) =>
                      void mark(
                        {
                          dateKey,
                          date: chosenMs,
                          slotId: slot.id,
                          subjectId: subject.id,
                        },
                        status,
                      )
                    }
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {error && <p className={cn('mt-4 text-body-sm text-error')}>{error}</p>}

        <button type="button" onClick={onClose} className="btn-ghost mt-6 w-full">
          Done
        </button>
      </div>
    </div>
  )
}
