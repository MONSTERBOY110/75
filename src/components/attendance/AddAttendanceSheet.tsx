import { useEffect, useMemo, useState } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import { extraSlotId, recordKey, type LogStatus } from '../../lib/attendance'
import { useMarking } from '../../hooks/useMarking'
import type { AttendanceRecord, AttendanceStatus, Slot, Subject } from '../../types'
import { cn } from '../../utils/cn'
import { formatTime, fromDateKey, isoWeekday, minutesOfDay, toDateKey } from '../../utils/date'
import { MarkButtons } from './MarkButtons'

/**
 * Back-fill sheet: pick any past date and mark the class you forgot.
 *
 * Alongside the slots the routine puts on that weekday, a substitution class can
 * be added for a day the subject was never scheduled. Those carry their own
 * occurrence, so adding one adds a class to the subject's total and deleting it
 * takes the class away again. Dates outside the semester are still refused.
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
  const [addingExtra, setAddingExtra] = useState(false)
  const [extraStart, setExtraStart] = useState('10:00')
  const [extraEnd, setExtraEnd] = useState('11:00')
  const { mark, remove, busyKey, error } = useMarking()

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

  // Substitution classes already recorded for this subject on this date.
  const extras = records
    .filter((r) => r.extra && r.dateKey === dateKey && r.subjectId === subject.id)
    .sort((a, b) => (a.start ?? '').localeCompare(b.start ?? ''))

  // Reserved up front so the pending row can show its own busy state.
  const nextExtraSlotId = extraSlotId(
    subject.id,
    records.filter((r) => r.dateKey === dateKey).map((r) => r.slotId),
  )

  async function addExtra(status: AttendanceStatus | null) {
    if (!status) return
    await mark(
      {
        dateKey,
        date: chosenMs,
        slotId: nextExtraSlotId,
        subjectId: subject.id,
        extra: true,
        start: extraStart,
        end: extraEnd,
      },
      status,
    )
    setAddingExtra(false)
  }

  /** Deleting the record deletes the class, since an extra has no routine slot. */
  async function removeExtra(slotId: string) {
    await remove(dateKey, slotId)
  }

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
          ) : (
            <div className="flex flex-col gap-5">
              {matching.length === 0 && extras.length === 0 && (
                <p className="text-body-sm text-on-surface-variant">
                  No {subject.short} class on that day. If it ran as a substitution, add it below.
                </p>
              )}

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

              {/* Substitution classes already recorded for this date. */}
              {extras.map((record) => (
                <div key={record.slotId}>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-body-sm text-on-surface-variant">
                      <span className="chip mr-2 border-primary text-primary">Extra</span>
                      {record.start ? formatTime(record.start) : 'Substitution class'}
                    </p>
                    <button
                      type="button"
                      aria-label="Remove extra class"
                      onClick={() => void removeExtra(record.slotId)}
                      className="text-secondary transition-opacity active:opacity-60"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                  <MarkButtons
                    value={record.status}
                    busy={busyKey === recordKey(dateKey, record.slotId)}
                    onMark={(status) =>
                      void mark(
                        {
                          dateKey,
                          date: chosenMs,
                          slotId: record.slotId,
                          subjectId: subject.id,
                          extra: true,
                          start: record.start,
                          end: record.end,
                        },
                        status,
                      )
                    }
                  />
                </div>
              ))}

              {/* Adding a class the routine never scheduled. */}
              <div className="border-t-2 border-outline-variant pt-4">
                {addingExtra ? (
                  <>
                    <p className="field-label">Extra class time</p>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        aria-label="Extra class start time"
                        type="time"
                        className="input"
                        value={extraStart}
                        onChange={(e) => setExtraStart(e.target.value)}
                      />
                      <input
                        aria-label="Extra class end time"
                        type="time"
                        className="input"
                        value={extraEnd}
                        onChange={(e) => setExtraEnd(e.target.value)}
                      />
                    </div>
                    <p className="mt-2 text-body-sm text-on-surface-variant">
                      Mark it and it joins {subject.short}'s total for that day.
                    </p>
                    <MarkButtons
                      className="mt-3"
                      value="unmarked"
                      busy={busyKey === recordKey(dateKey, nextExtraSlotId)}
                      onMark={(status) => void addExtra(status)}
                    />
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAddingExtra(true)}
                    className="press flex min-h-12 w-full items-center justify-center gap-2 border-2 border-dashed border-primary bg-transparent px-4 font-pixel text-[9px] uppercase tracking-wider text-primary"
                  >
                    <Plus className="h-4 w-4" strokeWidth={3} />
                    Add substitution class
                  </button>
                )}
              </div>
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
