import { useMemo, useState, type FormEvent } from 'react'
import { CalendarDays } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { ChoiceGrid } from '../components/ui/ChoiceGrid'
import { Input } from '../components/ui/Input'
import { PixelAvatar } from '../components/ui/PixelAvatar'
import { useAuth, useUid } from '../context/AuthContext'
import { sectionsFor, weeklyClassCount } from '../data/routines'
import { completeSetup } from '../services/user'
import type { AvatarStyle } from '../types'
import { cn } from '../utils/cn'
import { fromDateKey, toDateKey } from '../utils/date'

const YEARS = [1, 2, 3, 4].map((y) => ({ value: y, label: `${y}${['st', 'nd', 'rd', 'th'][y - 1]} yr` }))

export default function SetupPage() {
  const uid = useUid()
  const { profile } = useAuth()
  const hasPhoto = Boolean(profile?.photoURL)

  // Prefilled from the profile, so a student sent back here to pick a lab batch
  // does not have to re-enter everything they already answered.
  const [year, setYear] = useState(profile?.year ?? 3)
  const [semester, setSemester] = useState(profile?.semester ?? 5)
  const [sectionId, setSectionId] = useState(profile?.sectionId ?? '')
  const [batch, setBatch] = useState(profile?.batch ?? '')
  const [startKey, setStartKey] = useState(() =>
    toDateKey(profile?.semesterStartDate ?? Date.now()),
  )
  const [avatarStyle, setAvatarStyle] = useState<AvatarStyle | ''>(profile?.avatarStyle ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const semesters = useMemo(
    () => [year * 2 - 1, year * 2].map((s) => ({ value: s, label: `Sem ${s}` })),
    [year],
  )
  const sections = useMemo(() => sectionsFor(year, semester), [year, semester])

  const chosenSection = useMemo(
    () => sections.find((s) => s.id === sectionId),
    [sections, sectionId],
  )
  const batchOptions = useMemo(
    () => (chosenSection?.batches ?? []).map((b) => ({ value: b, label: `Batch ${b}` })),
    [chosenSection],
  )

  function onYear(next: number) {
    setYear(next)
    setSemester(next * 2 - 1)
    setSectionId('')
    setBatch('')
  }

  function onSemester(next: number) {
    setSemester(next)
    setSectionId('')
    setBatch('')
  }

  function onSection(next: string) {
    setSectionId(next)
    setBatch('')
  }

  const startMs = fromDateKey(startKey)
  const canSubmit =
    Boolean(sectionId) &&
    (batchOptions.length === 0 || batch !== '') &&
    Number.isFinite(startMs) &&
    (hasPhoto || avatarStyle !== '')

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!canSubmit) return

    setError('')
    setLoading(true)
    try {
      await completeSetup(uid, {
        year,
        semester,
        sectionId,
        batch: batch || undefined,
        semesterStartDate: startMs,
        avatarStyle: avatarStyle || undefined,
      })
      // The setup gate routes to /home once the profile snapshot lands.
    } catch {
      setError('Could not save your details. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="app-shell px-margin pb-10 pt-8">
      <h1 className="wordmark text-[20px]">Your routine</h1>
      <p className="mt-3 text-body-lg text-on-surface-variant">
        We use this to work out how many classes have been held so far.
      </p>

      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-6">
        <ChoiceGrid label="Year" options={YEARS} value={year} onChange={onYear} columns={4} />
        <ChoiceGrid
          label="Semester"
          options={semesters}
          value={semester}
          onChange={onSemester}
          columns={2}
        />

        <div>
          <span className="field-label">Section</span>
          {sections.length === 0 ? (
            <div className="border-2 border-dashed border-outline-variant p-5 text-center">
              <p className="text-body-sm text-on-surface-variant">
                No routines for semester {semester} yet.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {sections.map((section) => {
                const soon = section.status === 'soon'
                const active = section.id === sectionId
                return (
                  <button
                    key={section.id}
                    type="button"
                    disabled={soon}
                    aria-pressed={active}
                    onClick={() => onSection(section.id)}
                    className={cn(
                      'press flex h-14 w-full items-center justify-between border-2 px-4',
                      active
                        ? 'border-black bg-primary text-on-primary'
                        : 'border-outline bg-surface-container-high text-on-surface',
                    )}
                    style={{ boxShadow: active ? '4px 4px 0 0 #1b7fa8' : '4px 4px 0 0 #000' }}
                  >
                    <span className="font-pixel text-[11px] uppercase tracking-wider">
                      {section.label}
                    </span>
                    <span
                      className={cn(
                        'chip',
                        active
                          ? 'border-black/40 text-on-primary'
                          : 'border-outline text-on-surface-variant',
                      )}
                    >
                      {soon ? 'Soon' : `${weeklyClassCount(section)}/wk`}
                    </span>
                  </button>
                )
              })}
              <p className="mt-1 text-center font-pixel text-[8px] uppercase tracking-wider text-on-surface-variant">
                More sections coming soon
              </p>
            </div>
          )}
        </div>

        {/* Only sections that split for labs ask this. */}
        {batchOptions.length > 0 && (
          <div>
            <ChoiceGrid
              label="Lab batch"
              options={batchOptions}
              value={batch}
              onChange={setBatch}
              columns={batchOptions.length}
            />
            <p className="mt-2 text-body-sm text-on-surface-variant">
              Your section splits for labs. Pick the batch you attend with, so only your own lab
              classes are counted.
            </p>
          </div>
        )}

        <Input
          label="Semester start date"
          name="semesterStart"
          type="date"
          required
          max={toDateKey(Date.now())}
          value={startKey}
          onChange={(e) => setStartKey(e.target.value)}
          trailing={<CalendarDays className="h-5 w-5 text-on-surface-variant" />}
        />

        {!hasPhoto && (
          <div>
            <span className="field-label">Pick your avatar</span>
            <div className="grid grid-cols-2 gap-3">
              {(['boy', 'girl'] as const).map((style) => {
                const active = avatarStyle === style
                return (
                  <button
                    key={style}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setAvatarStyle(style)}
                    className={cn(
                      'press flex flex-col items-center gap-2 border-2 p-4',
                      active
                        ? 'border-primary bg-primary/10'
                        : 'border-outline bg-surface-container-high',
                    )}
                    style={{ boxShadow: active ? '4px 4px 0 0 #1b7fa8' : '4px 4px 0 0 #000' }}
                  >
                    <span className="h-16 w-16">
                      <PixelAvatar style={style} />
                    </span>
                    <span
                      className={cn(
                        'font-pixel text-[9px] uppercase tracking-wider',
                        active ? 'text-primary' : 'text-on-surface-variant',
                      )}
                    >
                      {style}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {error && <p className="text-body-sm text-error">{error}</p>}

        <Button type="submit" loading={loading} disabled={!canSubmit}>
          Start tracking
        </Button>
      </form>
    </div>
  )
}
