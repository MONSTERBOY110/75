import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AlertTriangle, Plus, Trash2 } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { ChoiceGrid } from '../components/ui/ChoiceGrid'
import { Input } from '../components/ui/Input'
import { ScreenHeader } from '../components/ui/ScreenHeader'
import { useUid } from '../context/AuthContext'
import { useColleges, useCollegeSections } from '../hooks/useColleges'
import {
  draftToSection,
  slotIdFor,
  subjectIdFor,
  validateDraft,
  type DraftSlot,
  type DraftSubject,
} from '../lib/routineDraft'
import { addSectionToCollege, createCollegeWithSection, updateSection } from '../services/colleges'
import type { SubjectKind } from '../types'
import { cn } from '../utils/cn'
import { normalizeCollegeName } from '../utils/collegeName'
import { addMinutesToTime, formatTime, minutesOfDay, WEEKDAY_LABELS } from '../utils/date'

const DAYS = [1, 2, 3, 4, 5, 6].map((d) => ({ value: d, label: WEEKDAY_LABELS[d - 1] }))
const YEARS = [1, 2, 3, 4].map((y) => ({ value: y, label: `Yr ${y}` }))

export default function AddCollegePage() {
  const uid = useUid()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { colleges } = useColleges()

  // ?college=<id> means the college is already listed and only a section is
  // missing, so the name is fixed and this becomes "add section".
  const existingCollegeId = params.get('college') ?? ''
  const existingCollege = colleges.find((c) => c.id === existingCollegeId)
  const sectionOnly = Boolean(existingCollegeId)

  // ?section=<id> as well means we are editing a routine this student added.
  const editingSectionId = params.get('section') ?? ''
  const editing = Boolean(existingCollegeId && editingSectionId)
  const { sections } = useCollegeSections(editing ? existingCollegeId : undefined)
  const editingSection = sections.find((s) => s.id === editingSectionId)

  const [collegeName, setCollegeName] = useState('')
  const [label, setLabel] = useState('')
  const [year, setYear] = useState(3)
  const [semester, setSemester] = useState(5)

  const [subjects, setSubjects] = useState<DraftSubject[]>([])
  const [newSubject, setNewSubject] = useState('')
  const [newCode, setNewCode] = useState('')
  const [newKind, setNewKind] = useState<SubjectKind>('theory')

  const [slots, setSlots] = useState<DraftSlot[]>([])
  const [day, setDay] = useState(1)
  const [start, setStart] = useState('10:00')
  const [end, setEnd] = useState('11:00')
  const [periodSubject, setPeriodSubject] = useState('')

  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [showErrors, setShowErrors] = useState(false)
  const [prefilled, setPrefilled] = useState(false)

  // Load the routine being edited into the form, once.
  useEffect(() => {
    if (!editing || prefilled || !editingSection) return
    setPrefilled(true)
    setLabel(editingSection.label)
    setYear(editingSection.year)
    setSemester(editingSection.semester)
    setSubjects(
      editingSection.subjects.map((s) => ({
        id: s.id,
        name: s.name,
        code: s.code === s.name ? '' : s.code,
        kind: s.kind,
      })),
    )
    setSlots(
      editingSection.slots.map((s) => ({
        id: s.id,
        day: s.day,
        start: s.start,
        end: s.end,
        subjectId: s.subjectId,
      })),
    )
  }, [editing, prefilled, editingSection])

  // In section-only mode the existing college's stored name is authoritative.
  const preview = sectionOnly
    ? (existingCollege?.name ?? '')
    : normalizeCollegeName(collegeName)
  const semesters = useMemo(
    () => [year * 2 - 1, year * 2].map((s) => ({ value: s, label: `Sem ${s}` })),
    [year],
  )

  const draft = { collegeName, label, year, semester, subjects, slots }
  const errors = validateDraft(draft, preview)

  const daySlots = useMemo(
    () =>
      slots
        .filter((s) => s.day === day)
        .sort((a, b) => minutesOfDay(a.start) - minutesOfDay(b.start)),
    [slots, day],
  )

  function addSubject() {
    const name = newSubject.trim()
    if (!name) return
    setSubjects((prev) => [
      ...prev,
      {
        id: subjectIdFor(name, prev.map((s) => s.id)),
        name,
        code: newCode.trim(),
        kind: newKind,
      },
    ])
    setNewSubject('')
    setNewCode('')
  }

  function removeSubject(id: string) {
    setSubjects((prev) => prev.filter((s) => s.id !== id))
    // Drop any periods that pointed at it, so the routine stays consistent.
    setSlots((prev) => prev.filter((s) => s.subjectId !== id))
    if (periodSubject === id) setPeriodSubject('')
  }

  function addPeriod() {
    if (!periodSubject) return
    setSlots((prev) => [
      ...prev,
      { id: slotIdFor(day, start, prev.map((s) => s.id)), day, start, end, subjectId: periodSubject },
    ])

    // Chain the next period on from this one, keeping the same length, which is
    // how routines usually run. Without carrying the duration the next period
    // would start and end at the same minute and fail validation.
    const minutes = Math.max(30, minutesOfDay(end) - minutesOfDay(start))
    setStart(end)
    setEnd(addMinutesToTime(end, minutes))
  }

  function removePeriod(id: string) {
    setSlots((prev) => prev.filter((s) => s.id !== id))
  }

  async function save() {
    setShowErrors(true)
    if (errors.length > 0) return

    setSaving(true)
    setSaveError('')
    try {
      const { subjects: outSubjects, slots: outSlots } = draftToSection(draft)
      const input = { label, year, semester, subjects: outSubjects, slots: outSlots }

      if (editing) {
        await updateSection(existingCollegeId, editingSectionId, input)
        navigate('/profile', { replace: true })
        return
      }

      const result = sectionOnly
        ? {
            collegeId: existingCollegeId,
            sectionId: await addSectionToCollege(uid, existingCollegeId, input),
          }
        : await createCollegeWithSection(uid, collegeName, input)

      // Hand the new routine straight back to setup, already selected.
      navigate(`/setup?college=${result.collegeId}&section=${result.sectionId}`, { replace: true })
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : 'Could not save your college. Please try again.',
      )
      setSaving(false)
    }
  }

  return (
    <div className="app-shell px-margin pb-10 pt-3">
      <ScreenHeader
        title={editing ? 'Edit routine' : sectionOnly ? 'Add section' : 'Add college'}
        onBack={() => navigate(editing ? '/profile' : '/setup')}
      />

      <p className="mt-4 text-body-lg text-on-surface-variant">
        {editing
          ? 'Correct the classes below.'
          : sectionOnly
            ? 'Add your section once and everyone in it can use it.'
            : 'Add your college once and everyone there can use it.'}
      </p>

      {editing && (
        <div className="mt-5 flex items-start gap-2 border-2 border-warning/40 bg-warning/10 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <p className="text-body-sm text-warning">
            This routine is shared, so your changes apply to everyone in this section. Removing a
            period stops its past marks counting.
          </p>
        </div>
      )}

      {/* 1. College name */}
      <section className="mt-7">
        <h2 className="mb-3 font-pixel text-[11px] uppercase tracking-wider text-primary">
          1. College
        </h2>
        {sectionOnly ? (
          <div className="border-2 border-outline bg-surface-container px-4 py-3">
            <p className="text-body-lg leading-snug text-on-surface">
              {existingCollege?.name ?? 'Loading...'}
            </p>
          </div>
        ) : (
          <>
            <Input
              label="College name"
              name="collegeName"
              value={collegeName}
              onChange={(e) => setCollegeName(e.target.value)}
              placeholder="e.g. abc college of engineering"
              maxLength={120}
            />
            {collegeName.trim() !== '' && (
              <p className="mt-2 text-body-sm text-on-surface-variant">
                Saved as <span className="text-primary">{preview || '...'}</span>
              </p>
            )}
          </>
        )}
      </section>

      {/* 2. Section */}
      <section className="mt-7">
        <h2 className="mb-3 font-pixel text-[11px] uppercase tracking-wider text-primary">
          2. Your section
        </h2>
        <Input
          label="Section name"
          name="sectionLabel"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. CSE-A"
          maxLength={40}
        />
        <ChoiceGrid
          className="mt-4"
          label="Year"
          options={YEARS}
          value={year}
          onChange={(next) => {
            setYear(next)
            setSemester(next * 2 - 1)
          }}
          columns={4}
        />
        <ChoiceGrid
          className="mt-4"
          label="Semester"
          options={semesters}
          value={semester}
          onChange={setSemester}
          columns={2}
        />
      </section>

      {/* 3. Subjects */}
      <section className="mt-7">
        <h2 className="mb-3 font-pixel text-[11px] uppercase tracking-wider text-primary">
          3. Subjects
        </h2>

        {subjects.length > 0 && (
          <div className="mb-4 flex flex-col gap-2">
            {subjects.map((subject) => (
              <div
                key={subject.id}
                className="flex items-center justify-between gap-3 border-2 border-outline bg-surface-container px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-body-lg text-on-surface">{subject.name}</p>
                  <p className="mt-0.5 font-pixel text-[8px] uppercase tracking-wider text-on-surface-variant">
                    {subject.code || 'no code'} · {subject.kind}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label={`Remove ${subject.name}`}
                  onClick={() => removeSubject(subject.id)}
                  className="shrink-0 text-secondary transition-opacity active:opacity-60"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="card flex flex-col gap-3 p-4">
          <Input
            label="Subject name"
            name="subjectName"
            value={newSubject}
            onChange={(e) => setNewSubject(e.target.value)}
            placeholder="e.g. Operating Systems"
            maxLength={80}
          />
          <Input
            label="Code (optional)"
            name="subjectCode"
            value={newCode}
            onChange={(e) => setNewCode(e.target.value)}
            placeholder="e.g. PCC-CS502"
            maxLength={30}
          />
          <ChoiceGrid
            label="Type"
            options={[
              { value: 'theory', label: 'Theory' },
              { value: 'practical', label: 'Practical' },
            ]}
            value={newKind}
            onChange={(v) => setNewKind(v as SubjectKind)}
            columns={2}
          />
          <Button
            type="button"
            variant="ghost"
            onClick={addSubject}
            disabled={!newSubject.trim()}
            className="mt-1"
          >
            <Plus className="h-4 w-4" strokeWidth={3} />
            Add subject
          </Button>
        </div>
      </section>

      {/* 4. Timetable */}
      <section className="mt-7">
        <h2 className="mb-1 font-pixel text-[11px] uppercase tracking-wider text-primary">
          4. Timetable
        </h2>
        <p className="mb-3 text-body-sm text-on-surface-variant">
          {slots.length} {slots.length === 1 ? 'class' : 'classes'} a week
        </p>

        {subjects.length === 0 ? (
          <div className="border-2 border-dashed border-outline-variant p-5 text-center">
            <p className="text-body-sm text-on-surface-variant">Add your subjects first.</p>
          </div>
        ) : (
          <>
            <ChoiceGrid label="Day" options={DAYS} value={day} onChange={setDay} columns={6} />

            <div className="mt-4 flex flex-col gap-2">
              {daySlots.length === 0 ? (
                <div className="border-2 border-dashed border-outline-variant p-4 text-center">
                  <p className="text-body-sm text-on-surface-variant">
                    No classes on {WEEKDAY_LABELS[day - 1]} yet.
                  </p>
                </div>
              ) : (
                daySlots.map((slot) => {
                  const subject = subjects.find((s) => s.id === slot.subjectId)
                  return (
                    <div
                      key={slot.id}
                      className="flex items-center justify-between gap-3 border-2 border-outline bg-surface-container px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-body-lg text-on-surface">
                          {subject?.name ?? 'Removed subject'}
                        </p>
                        <p className="mt-0.5 font-pixel text-[8px] uppercase tracking-wider text-on-surface-variant">
                          {formatTime(slot.start)} to {formatTime(slot.end)}
                        </p>
                      </div>
                      <button
                        type="button"
                        aria-label="Remove period"
                        onClick={() => removePeriod(slot.id)}
                        className="shrink-0 text-secondary transition-opacity active:opacity-60"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  )
                })
              )}
            </div>

            <div className="card mt-3 flex flex-col gap-3 p-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="periodStart" className="field-label">
                    From
                  </label>
                  <input
                    id="periodStart"
                    type="time"
                    className="input"
                    value={start}
                    onChange={(e) => setStart(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="periodEnd" className="field-label">
                    To
                  </label>
                  <input
                    id="periodEnd"
                    type="time"
                    className="input"
                    value={end}
                    onChange={(e) => setEnd(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="periodSubject" className="field-label">
                  Subject
                </label>
                <select
                  id="periodSubject"
                  className="input appearance-none"
                  value={periodSubject}
                  onChange={(e) => setPeriodSubject(e.target.value)}
                >
                  <option value="">Choose a subject</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>

              <Button
                type="button"
                variant="ghost"
                onClick={addPeriod}
                disabled={!periodSubject}
                className="mt-1"
              >
                <Plus className="h-4 w-4" strokeWidth={3} />
                Add to {WEEKDAY_LABELS[day - 1]}
              </Button>
            </div>
          </>
        )}
      </section>

      {showErrors && errors.length > 0 && (
        <div className="mt-6 border-2 border-error/50 bg-error/10 p-4">
          <p className="font-pixel text-[9px] uppercase tracking-wider text-error">
            Fix these first
          </p>
          <ul className="mt-2 flex flex-col gap-1">
            {errors.map((e) => (
              <li key={e} className={cn('text-body-sm text-error')}>
                {e}
              </li>
            ))}
          </ul>
        </div>
      )}

      {saveError && <p className="mt-4 text-body-sm text-error">{saveError}</p>}

      <div className="sticky bottom-0 mt-7 bg-background pb-2 pt-3">
        <Button type="button" onClick={() => void save()} loading={saving}>
          {editing ? 'Save changes' : sectionOnly ? 'Save section' : 'Save college'}
        </Button>
      </div>
    </div>
  )
}
