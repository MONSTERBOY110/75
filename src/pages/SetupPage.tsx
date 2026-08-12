import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { AlertTriangle, Plus } from 'lucide-react'

import { Button } from '../components/ui/Button'
import { CollegeSelect } from '../components/ui/CollegeSelect'
import { ChoiceGrid } from '../components/ui/ChoiceGrid'
import { Input } from '../components/ui/Input'
import { PixelAvatar } from '../components/ui/PixelAvatar'
import { ScreenHeader } from '../components/ui/ScreenHeader'
import { Spinner } from '../components/ui/Spinner'
import { useAuth, useUid } from '../context/AuthContext'
import { weeklyClassCount } from '../data/routines'
import { useColleges, useCollegeSections } from '../hooks/useColleges'
import { completeSetup } from '../services/user'
import type { AvatarStyle } from '../types'
import { cn } from '../utils/cn'
import { fromDateKey, toDateKey } from '../utils/date'

export default function SetupPage() {
  const uid = useUid()
  const { profile } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [params] = useSearchParams()
  const hasPhoto = Boolean(profile?.photoURL)

  // The same screen serves first-run setup and changing routine later.
  const changing = location.pathname === '/routine'

  const { colleges, loading: collegesLoading } = useColleges()

  // Prefilled from the profile so a student sent back here (to pick a lab batch,
  // say) does not have to re-enter what they already answered. A fresh routine
  // just added by this student arrives as ?college=&section=.
  const [collegeId, setCollegeId] = useState(params.get('college') ?? profile?.collegeId ?? '')
  const [sectionId, setSectionId] = useState(params.get('section') ?? profile?.sectionId ?? '')
  const [batch, setBatch] = useState(profile?.batch ?? '')
  const [startKey, setStartKey] = useState(() =>
    toDateKey(profile?.semesterStartDate ?? Date.now()),
  )
  const [avatarStyle, setAvatarStyle] = useState<AvatarStyle | ''>(profile?.avatarStyle ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { sections, loading: sectionsLoading } = useCollegeSections(collegeId || undefined)

  const chosenSection = useMemo(
    () => sections.find((s) => s.id === sectionId),
    [sections, sectionId],
  )
  const batchOptions = useMemo(
    () => (chosenSection?.batches ?? []).map((b) => ({ value: b, label: `Batch ${b}` })),
    [chosenSection],
  )

  // A section chosen from a previous college must not linger.
  useEffect(() => {
    if (sectionId && !sectionsLoading && sections.length && !chosenSection) setSectionId('')
  }, [sectionId, sections, sectionsLoading, chosenSection])

  const startMs = fromDateKey(startKey)
  const canSubmit =
    Boolean(collegeId) &&
    Boolean(chosenSection) &&
    (batchOptions.length === 0 || batch !== '') &&
    Number.isFinite(startMs) &&
    (hasPhoto || avatarStyle !== '')

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!canSubmit || !chosenSection) return

    setError('')
    setLoading(true)
    try {
      await completeSetup(uid, {
        collegeId,
        // Year and semester come from the routine itself, so they can never
        // disagree with the section the student picked.
        year: chosenSection.year,
        semester: chosenSection.semester,
        sectionId: chosenSection.id,
        batch: batch || undefined,
        semesterStartDate: startMs,
        avatarStyle: avatarStyle || undefined,
      })
      // On first run the setup gate routes to /home once the profile lands; when
      // changing routine the gate would leave us here, so go back deliberately.
      if (changing) navigate('/profile', { replace: true })
    } catch {
      setError('Could not save your details. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="app-shell px-margin pb-10 pt-3">
      {changing ? (
        <ScreenHeader title="Change routine" onBack={() => navigate('/profile')} />
      ) : (
        <div className="pt-5" />
      )}

      <h1 className="wordmark mt-2 text-[20px]">Your routine</h1>
      <p className="mt-3 text-body-lg text-on-surface-variant">
        We use this to work out how many classes have been held so far.
      </p>

      {changing && (
        <div className="mt-5 flex items-start gap-2 border-2 border-warning/40 bg-warning/10 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <p className="text-body-sm text-warning">
            Marks you made against your current section's classes stop counting if you switch. They
            are not deleted, so switching back brings them straight back.
          </p>
        </div>
      )}

      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-6">
        <div>
          <span className="field-label">College</span>
          <CollegeSelect
            colleges={colleges}
            loading={collegesLoading}
            value={collegeId}
            onChange={(next) => {
              setCollegeId(next)
              setSectionId('')
              setBatch('')
            }}
            onAddOwn={() => navigate('/add-college')}
          />
        </div>

        {collegeId && (
          <div>
            <span className="field-label">Section</span>
            {sectionsLoading ? (
              <div className="flex justify-center py-6">
                <Spinner />
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {sections.length === 0 && (
                  <div className="border-2 border-dashed border-outline-variant p-5 text-center">
                    <p className="text-body-sm text-on-surface-variant">
                      No routines added for this college yet. Add yours below.
                    </p>
                  </div>
                )}
                {sections.map((section) => {
                  const soon = section.status === 'soon'
                  const active = section.id === sectionId
                  return (
                    <button
                      key={section.id}
                      type="button"
                      disabled={soon}
                      aria-pressed={active}
                      onClick={() => {
                        setSectionId(section.id)
                        setBatch('')
                      }}
                      className={cn(
                        'press flex h-14 w-full items-center justify-between gap-2 border-2 px-4',
                        active
                          ? 'border-black bg-primary text-on-primary'
                          : 'border-outline bg-surface-container-high text-on-surface',
                      )}
                      style={{ boxShadow: active ? '4px 4px 0 0 #1b7fa8' : '4px 4px 0 0 #000' }}
                    >
                      <span className="truncate font-pixel text-[11px] uppercase tracking-wider">
                        {section.label}
                      </span>
                      <span
                        className={cn(
                          'chip shrink-0',
                          active
                            ? 'border-black/40 text-on-primary'
                            : 'border-outline text-on-surface-variant',
                        )}
                      >
                        {soon
                          ? 'Soon'
                          : `Y${section.year} S${section.semester} · ${weeklyClassCount(section)}/wk`}
                      </span>
                    </button>
                  )
                })}

                {/* For a student whose section nobody has entered yet. */}
                <button
                  type="button"
                  onClick={() => navigate(`/add-college?college=${collegeId}`)}
                  className="press flex min-h-14 w-full items-center justify-center gap-2 border-2 border-dashed border-primary bg-transparent px-4 font-pixel text-[10px] uppercase tracking-wider text-primary"
                >
                  <Plus className="h-4 w-4" strokeWidth={3} />
                  Add your section
                </button>
              </div>
            )}
          </div>
        )}

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
          {changing ? 'Save routine' : 'Start tracking'}
        </Button>
      </form>
    </div>
  )
}
