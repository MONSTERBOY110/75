import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, ChevronRight, LogOut, Pencil, Replace, X } from 'lucide-react'
import { Avatar } from '../components/ui/Avatar'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { Input } from '../components/ui/Input'
import { PixelAvatar } from '../components/ui/PixelAvatar'
import { useAuth, useUid } from '../context/AuthContext'
import { BUILT_IN_COLLEGE, slotsForBatch } from '../data/routines'
import { useColleges } from '../hooks/useColleges'
import { useStats } from '../context/StatsContext'
import { logout } from '../services/auth'
import { ChoiceGrid } from '../components/ui/ChoiceGrid'
import {
  updateAvatarStyle,
  updateBatch,
  updateDisplayName,
  updateSemesterStart,
} from '../services/user'
import type { AvatarStyle } from '../types'
import { cn } from '../utils/cn'
import { formatDate, fromDateKey, toDateKey } from '../utils/date'

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-2 border-outline bg-surface-container px-4 py-3">
      <span className="font-pixel text-[8px] uppercase tracking-wider text-on-surface-variant">
        {label}
      </span>
      <span className="text-body-lg text-on-surface">{value}</span>
    </div>
  )
}

export default function ProfilePage() {
  const uid = useUid()
  const { user, profile } = useAuth()
  const stats = useStats()
  const section = stats.section
  const { colleges } = useColleges()
  const college = colleges.find((c) => c.id === (profile?.collegeId ?? BUILT_IN_COLLEGE.id))

  const [editingName, setEditingName] = useState(false)
  const [draftName, setDraftName] = useState(profile?.name ?? '')
  const [savingName, setSavingName] = useState(false)
  const [confirmOut, setConfirmOut] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  // The date the student picked, held back until they confirm the recalculation.
  const [pendingStart, setPendingStart] = useState<number | null>(null)
  const [savingStart, setSavingStart] = useState(false)
  const [error, setError] = useState('')

  const hasPhoto = Boolean(profile?.photoURL)
  // Bundled routines carry no createdBy, so they are never editable here.
  const canEditRoutine = Boolean(section?.createdBy && section.createdBy === uid)

  async function saveName() {
    if (!draftName.trim()) return
    setSavingName(true)
    setError('')
    try {
      await updateDisplayName(uid, draftName)
      setEditingName(false)
    } catch {
      setError('Could not update your name.')
    } finally {
      setSavingName(false)
    }
  }

  async function pickAvatar(style: AvatarStyle) {
    setError('')
    try {
      await updateAvatarStyle(uid, style)
    } catch {
      setError('Could not update your avatar.')
    }
  }

  async function pickBatch(next: string) {
    setError('')
    try {
      await updateBatch(uid, next)
    } catch {
      setError('Could not update your lab batch.')
    }
  }

  /**
   * Applies the date the student confirmed. Changing it recomputes every
   * subject's total, so the write only happens from the dialog.
   */
  async function applyStart() {
    if (pendingStart === null) return
    setSavingStart(true)
    setError('')
    try {
      await updateSemesterStart(uid, pendingStart)
      setPendingStart(null)
    } catch {
      setError('Could not update the semester start date.')
      setPendingStart(null)
    } finally {
      setSavingStart(false)
    }
  }

  return (
    <div>
      <div className="flex h-12 items-center">
        <h1 className="wordmark text-[15px]">Profile</h1>
      </div>

      <div className="mt-4 flex flex-col items-center text-center">
        <Avatar
          photoURL={profile?.photoURL}
          style={profile?.avatarStyle}
          name={profile?.name}
          size="lg"
        />
        {editingName ? (
          <div className="mt-4 flex w-full items-end gap-2">
            <Input
              name="displayName"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              maxLength={40}
              autoFocus
            />
            <button
              type="button"
              aria-label="Save name"
              disabled={savingName}
              onClick={() => void saveName()}
              className="press flex h-14 w-14 shrink-0 items-center justify-center border-[3px] border-black bg-primary text-on-primary disabled:opacity-50"
              style={{ boxShadow: '4px 4px 0 0 #1b7fa8' }}
            >
              <Check className="h-6 w-6" strokeWidth={3} />
            </button>
            <button
              type="button"
              aria-label="Cancel"
              onClick={() => {
                setDraftName(profile?.name ?? '')
                setEditingName(false)
              }}
              className="press flex h-14 w-14 shrink-0 items-center justify-center border-2 border-outline bg-surface-container-high text-on-surface"
              style={{ boxShadow: '4px 4px 0 0 #000' }}
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setDraftName(profile?.name ?? '')
              setEditingName(true)
            }}
            className="mt-4 flex items-center gap-2 transition-opacity active:opacity-60"
          >
            <span className="text-headline-mobile text-on-surface">{profile?.name ?? 'Student'}</span>
            <Pencil className="h-4 w-4 text-primary" />
          </button>
        )}
        <p className="mt-1 text-body-sm text-on-surface-variant">{user?.email}</p>
      </div>

      {!hasPhoto && (
        <div className="mt-7">
          <span className="field-label">Avatar</span>
          <div className="grid grid-cols-2 gap-3">
            {(['boy', 'girl'] as const).map((style) => {
              const active = profile?.avatarStyle === style
              return (
                <button
                  key={style}
                  type="button"
                  aria-pressed={active}
                  onClick={() => void pickAvatar(style)}
                  className={cn(
                    'press flex items-center justify-center gap-3 border-2 p-3',
                    active ? 'border-primary bg-primary/10' : 'border-outline bg-surface-container-high',
                  )}
                  style={{ boxShadow: active ? '4px 4px 0 0 #1b7fa8' : '4px 4px 0 0 #000' }}
                >
                  <span className="h-10 w-10">
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

      <div className="mt-7 flex flex-col gap-2">
        {college && (
          <div className="border-2 border-outline bg-surface-container px-4 py-3">
            <span className="font-pixel text-[8px] uppercase tracking-wider text-on-surface-variant">
              College
            </span>
            <p className="mt-1 text-body-lg leading-snug text-on-surface">{college.name}</p>
          </div>
        )}
        <InfoRow label="Year" value={profile?.year ? `${profile.year}` : 'Not set'} />
        <InfoRow label="Semester" value={profile?.semester ? `${profile.semester}` : 'Not set'} />
        <InfoRow label="Section" value={section?.label ?? 'Not set'} />
        <InfoRow
          label="Classes / week"
          value={section ? `${slotsForBatch(section, profile?.batch).length}` : 'Not set'}
        />
      </div>

      {section?.batches?.length ? (
        <div className="mt-5">
          <ChoiceGrid
            label="Lab batch"
            options={section.batches.map((b) => ({ value: b, label: `Batch ${b}` }))}
            value={profile?.batch ?? ''}
            onChange={(next) => void pickBatch(next)}
            columns={section.batches.length}
          />
          <p className="mt-2 text-body-sm text-on-surface-variant">
            Only your batch's lab classes are counted.
          </p>
        </div>
      ) : null}

      <div className="mt-5">
        <label htmlFor="semesterStart" className="field-label">
          Semester started
        </label>
        <input
          id="semesterStart"
          type="date"
          className="input"
          max={toDateKey(Date.now())}
          value={
            pendingStart !== null
              ? toDateKey(pendingStart)
              : profile?.semesterStartDate
                ? toDateKey(profile.semesterStartDate)
                : ''
          }
          onChange={(e) => {
            const ms = fromDateKey(e.target.value)
            if (Number.isFinite(ms)) setPendingStart(ms)
          }}
        />
        {profile?.semesterStartDate && (
          <p className="mt-2 text-body-sm text-on-surface-variant">
            Counting classes from {formatDate(profile.semesterStartDate)}.
          </p>
        )}
      </div>

      <div className="mt-7">
        <span className="field-label">Routine</span>
        <div className="flex flex-col gap-2">
          <Link
            to="/routine"
            className="press flex min-h-14 items-center justify-between gap-3 border-2 border-outline bg-surface-container-high px-4"
            style={{ boxShadow: '4px 4px 0 0 #000' }}
          >
            <span className="flex items-center gap-2 font-pixel text-[10px] uppercase tracking-wider text-on-surface">
              <Replace className="h-4 w-4 text-primary" />
              Change section
            </span>
            <ChevronRight className="h-5 w-5 shrink-0 text-primary" />
          </Link>

          {/* Only the student who contributed a routine may correct it, which is
              also what the security rules enforce. */}
          {canEditRoutine && (
            <Link
              to={`/add-college?college=${profile?.collegeId ?? ''}&section=${section?.id ?? ''}`}
              className="press flex min-h-14 items-center justify-between gap-3 border-2 border-outline bg-surface-container-high px-4"
              style={{ boxShadow: '4px 4px 0 0 #000' }}
            >
              <span className="flex items-center gap-2 font-pixel text-[10px] uppercase tracking-wider text-on-surface">
                <Pencil className="h-4 w-4 text-primary" />
                Edit this routine
              </span>
              <ChevronRight className="h-5 w-5 shrink-0 text-primary" />
            </Link>
          )}
        </div>
      </div>

      {error && <p className="mt-4 text-body-sm text-error">{error}</p>}

      <button
        type="button"
        onClick={() => setConfirmOut(true)}
        className="btn-danger mt-8 w-full"
      >
        <LogOut className="h-4 w-4" />
        Log out
      </button>

      <p className="mt-6 text-center font-pixel text-[8px] uppercase tracking-wider text-on-surface-variant">
        75 · v{__APP_VERSION__}
      </p>

      <ConfirmDialog
        open={pendingStart !== null}
        title="Change semester start date?"
        message={
          pendingStart === null
            ? ''
            : `Every subject's total will be recalculated from ${formatDate(pendingStart)}. Your marks are kept.`
        }
        confirmLabel="Recalculate"
        busy={savingStart}
        onCancel={() => setPendingStart(null)}
        onConfirm={() => void applyStart()}
      />

      <ConfirmDialog
        open={confirmOut}
        title="Log out?"
        message="Your attendance stays saved to your account."
        confirmLabel="Log out"
        busy={loggingOut}
        onCancel={() => setConfirmOut(false)}
        onConfirm={() => {
          setLoggingOut(true)
          void logout().finally(() => {
            setLoggingOut(false)
            setConfirmOut(false)
          })
        }}
      />
    </div>
  )
}
