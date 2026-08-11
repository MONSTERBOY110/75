import { useMemo, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { AddAttendanceSheet } from '../components/attendance/AddAttendanceSheet'
import { LogRow } from '../components/attendance/LogRow'
import { PixelBar } from '../components/attendance/PixelBar'
import { ScreenHeader } from '../components/ui/ScreenHeader'
import { Spinner } from '../components/ui/Spinner'
import { useAuth } from '../context/AuthContext'

import { useMarking } from '../hooks/useMarking'
import { useStats } from '../context/StatsContext'
import { band, buildLog, recordKey } from '../lib/attendance'
import { adviceFor } from '../utils/advice'
import { BAND_TEXT } from '../utils/band'
import { cn } from '../utils/cn'

export default function SubjectDetailPage() {
  const { subjectId = '' } = useParams()
  const { profile } = useAuth()
  const stats = useStats()
  const { mark, busyKey, error } = useMarking()
  const [expanded, setExpanded] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const subject = stats.subjectsById.get(subjectId)

  const log = useMemo(
    () =>
      buildLog(
        stats.occurrences.filter((o) => o.subjectId === subjectId),
        stats.records,
      ),
    [stats.occurrences, stats.records, subjectId],
  )

  const slots = useMemo(
    () => stats.slots.filter((s) => s.subjectId === subjectId),
    [stats.slots, subjectId],
  )

  const stat = stats.bySubject.get(subjectId)

  // The subject isn't taught in this student's section (or their batch).
  if (!stats.loading && stats.section && (!subject || !stat)) {
    return <Navigate to="/subjects" replace />
  }

  const b = band(stat?.percent ?? 0, stat?.held ?? 0)
  const advice = stat ? adviceFor(stat) : null

  return (
    <div className="app-shell px-margin pb-28 pt-3">
      <ScreenHeader title={subject?.short ?? 'Subject'} />

      {stats.loading || !stat || !subject ? (
        <div className="mt-16 flex justify-center">
          <Spinner />
        </div>
      ) : (
        <>
          <div className="card mt-4 p-5">
            <p className="text-body-lg text-on-surface">{subject.name}</p>
            <p className="mt-0.5 font-pixel text-[8px] uppercase tracking-wider text-on-surface-variant">
              {subject.code} · {subject.kind}
            </p>

            <div className="mt-4 flex items-baseline gap-1">
              <span className={cn('text-display-lg', BAND_TEXT[b])}>{Math.round(stat.percent)}</span>
              <span className={cn('text-title-md', BAND_TEXT[b])}>%</span>
              <span className="ml-auto text-body-lg text-on-surface-variant">
                <span className="text-on-surface">{stat.attended}</span> / {stat.held}
              </span>
            </div>

            <PixelBar percent={stat.percent} band={b} className="mt-3" />

            <p className="mt-3 text-body-sm text-on-surface-variant">
              {advice ?? 'No classes held yet'}
            </p>

            {stat.notHeld > 0 && (
              <p className="mt-1 text-body-sm text-on-surface-variant">
                {stat.notHeld} {stat.notHeld === 1 ? 'class was' : 'classes were'} never held.
              </p>
            )}
          </div>

          <h2 className="mb-3 mt-7 font-pixel text-[11px] uppercase tracking-wider text-primary">
            History
          </h2>

          {log.length === 0 ? (
            <div className="border-2 border-dashed border-outline-variant p-6 text-center">
              <p className="text-body-sm text-on-surface-variant">
                No classes for this subject yet.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {log.map((entry) => {
                const key = recordKey(entry.dateKey, entry.slotId)
                return (
                  <LogRow
                    key={key}
                    entry={entry}
                    expanded={expanded === key}
                    busy={busyKey === key}
                    onToggle={() => setExpanded((cur) => (cur === key ? null : key))}
                    onMark={(status) =>
                      void mark(
                        {
                          dateKey: entry.dateKey,
                          date: entry.date,
                          slotId: entry.slotId,
                          subjectId: entry.subjectId,
                        },
                        status,
                      )
                    }
                  />
                )
              })}
            </div>
          )}

          {error && <p className="mt-3 text-body-sm text-error">{error}</p>}
        </>
      )}

      {/* Back-fill a class you forgot to mark on the day. Pinned to the app column. */}
      <div
        className="pointer-events-none fixed inset-x-0 z-30 mx-auto flex w-full max-w-app justify-end px-margin"
        style={{ bottom: 'max(24px, env(safe-area-inset-bottom))' }}
      >
        <button
          type="button"
          aria-label="Add attendance"
          onClick={() => setSheetOpen(true)}
          className="press pointer-events-auto flex h-14 w-14 items-center justify-center border-[3px] border-black bg-primary text-on-primary"
          style={{ boxShadow: '4px 4px 0 0 #1b7fa8' }}
        >
          <Plus className="h-7 w-7" strokeWidth={3} />
        </button>
      </div>

      <AddAttendanceSheet
        open={sheetOpen && Boolean(subject)}
        subject={subject!}
        slots={slots}
        records={stats.records}
        semesterStart={profile?.semesterStartDate ?? 0}
        onClose={() => setSheetOpen(false)}
      />
    </div>
  )
}
