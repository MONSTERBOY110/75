import { SubjectRow } from '../components/attendance/SubjectRow'
import { TodayPanel } from '../components/attendance/TodayPanel'
import { Spinner } from '../components/ui/Spinner'
import { getSubject } from '../data/subjects'
import type { SubjectStat } from '../lib/attendance'
import { useStats } from '../context/StatsContext'

function SubjectGroup({
  title,
  stats,
  className,
}: {
  title: string
  stats: SubjectStat[]
  className?: string
}) {
  if (stats.length === 0) return null
  return (
    <section className={className}>
      <h2 className="mb-3 font-pixel text-[11px] uppercase tracking-wider text-primary">{title}</h2>
      <div className="flex flex-col gap-3">
        {stats.map((stat) => (
          <SubjectRow key={stat.subjectId} stat={stat} />
        ))}
      </div>
    </section>
  )
}

export default function SubjectsPage() {
  const stats = useStats()
  const { subjectIds, bySubject, loading } = stats

  const all = subjectIds.map((id) => bySubject.get(id)!)
  const theory = all.filter((s) => getSubject(s.subjectId).kind === 'theory')
  const practical = all.filter((s) => getSubject(s.subjectId).kind === 'practical')

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
          <SubjectGroup title="Theory" stats={theory} className="mt-5" />
          <SubjectGroup title="Practical" stats={practical} className="mt-7" />
        </>
      )}

      <div className="mt-9">
        <TodayPanel stats={stats} />
      </div>
    </div>
  )
}
