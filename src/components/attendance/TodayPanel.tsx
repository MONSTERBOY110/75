import { CalendarOff } from 'lucide-react'
import { recordKey, type LogStatus } from '../../lib/attendance'
import { useMarking, type MarkTarget } from '../../hooks/useMarking'
import type { Stats } from '../../hooks/useStats'
import { formatDayAndDate, formatTime } from '../../utils/date'
import { MarkButtons } from './MarkButtons'

/** Marking surface for today's classes - the screen you open after each lecture. */
export function TodayPanel({ stats }: { stats: Stats }) {
  const { mark, markAllNotHeld, busyKey, error } = useMarking()
  const { todaySlots, todayKey, todayDate, records, subjectsById } = stats

  const statusOf = (slotId: string): LogStatus =>
    records.find((r) => r.dateKey === todayKey && r.slotId === slotId)?.status ?? 'unmarked'

  const targets: MarkTarget[] = todaySlots.map((slot) => ({
    dateKey: todayKey,
    date: todayDate,
    slotId: slot.id,
    subjectId: slot.subjectId,
  }))

  const allOff = todaySlots.length > 0 && todaySlots.every((s) => statusOf(s.id) === 'notHeld')

  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="font-pixel text-[11px] uppercase tracking-wider text-primary">Mark today</h2>
        <span className="text-body-sm text-on-surface-variant">{formatDayAndDate(todayDate)}</span>
      </div>

      {todaySlots.length === 0 ? (
        <div className="flex flex-col items-center gap-2 border-2 border-dashed border-outline-variant py-8 text-center">
          <CalendarOff className="h-7 w-7 text-on-surface-variant" />
          <p className="text-body-sm text-on-surface-variant">No classes scheduled today.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {todaySlots.map((slot) => {
            const subject = subjectsById.get(slot.subjectId)
            const target = targets.find((t) => t.slotId === slot.id)!
            return (
              <div key={slot.id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-body-lg text-on-surface">{subject?.name ?? slot.subjectId}</p>
                    <p className="mt-0.5 font-pixel text-[8px] uppercase tracking-wider text-on-surface-variant">
                      {subject?.code ?? ""}
                    </p>
                  </div>
                  <span className="shrink-0 text-body-sm text-on-surface-variant">
                    {formatTime(slot.start)}
                  </span>
                </div>

                <MarkButtons
                  className="mt-3"
                  value={statusOf(slot.id)}
                  busy={busyKey === recordKey(todayKey, slot.id)}
                  onMark={(status) => void mark(target, status)}
                />
              </div>
            )
          })}

          <button
            type="button"
            disabled={busyKey !== null || allOff}
            onClick={() => void markAllNotHeld(targets)}
            className="btn-ghost w-full"
          >
            <CalendarOff className="h-4 w-4" />
            {allOff ? 'Whole day marked off' : 'No classes today'}
          </button>
        </div>
      )}

      {error && <p className="mt-3 text-body-sm text-error">{error}</p>}
    </section>
  )
}
