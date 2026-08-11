import { SubjectRow } from '../components/attendance/SubjectRow'
import { TodayPanel } from '../components/attendance/TodayPanel'
import { Spinner } from '../components/ui/Spinner'
import type { SubjectStat } from '../lib/attendance'
import type { Subject } from '../types'
import { useStats } from '../context/StatsContext'

function SubjectGroup({
  title,
  stats,
  subjectsById,
  className,
}: {
  title: string
  stats: SubjectStat[]
  subjectsById: Map<string, Subject>
  className?: string
}) {
  if (stats.length === 0) return null
  return (
    <section className={className}>
      <h2 className="mb-3 font-pixel text-[11px] uppercase tracking-wider text-primary">{title}</h2>
      <div className="flex flex-col gap-3">
        {stats.map((stat) => {
          const subject = subjectsById.get(stat.subjectId)
          if (!subject) return null
          return <SubjectRow key={stat.subjectId} stat={stat} subject={subject} />
        })}
      </div>
    </section>
  )
}

export default function SubjectsPage() {
  const stats = useStats()
  const { subjectIds, bySubject, subjectsById, loading } = stats

  const all = subjectIds.map((id) => bySubject.get(id)!)
  const kindOf = (id: string) => subjectsById.get(id)?.kind
  const theory = all.filter((s) => kindOf(s.subjectId) === 'theory')
  const practical = all.filter((s) => kindOf(s.subjectId) === 'practical')

  if (loading) {
    return (
      <div className="mt-16 flex justify-center">
        <Spinner />
      </div>
    )
  }

  return (
    <div>
      <div className="flex h-12 items-center">
        <h1 className="wordmark text-[15px]">Subjects</h1>
      </div>

      {subjectIds.length === 0 ? (
        <div className="mt-6 border-2 border-dashed border-outline-variant p-6 text-center">
          <p className="text-body-sm text-on-surface-variant">
            No routine found for your section yet.
          </p>
        </div>
      ) : (
        <>
          <SubjectGroup title="Theory" stats={theory} subjectsById={subjectsById} className="mt-5" />
          <SubjectGroup
            title="Practical"
            stats={practical}
            subjectsById={subjectsById}
            className="mt-7"
          />
        </>
      )}

      <div className="mt-9">
        <TodayPanel stats={stats} />
      </div>
    </div>
  )
}
