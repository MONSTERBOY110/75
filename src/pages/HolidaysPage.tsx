import { useMemo, useState } from 'react'
import { AlertTriangle, CalendarOff, Plus, Trash2 } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { ChoiceGrid } from '../components/ui/ChoiceGrid'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { Input } from '../components/ui/Input'
import { ScreenHeader } from '../components/ui/ScreenHeader'
import { useAuth, useUid } from '../context/AuthContext'
import { useStats } from '../context/StatsContext'
import {
  classesInRange,
  formatHolidayRange,
  holidayDays,
  marksOverridden,
  validateHoliday,
} from '../lib/holidays'
import { addHoliday, removeHoliday } from '../services/holidays'
import type { Holiday } from '../types'
import { cn } from '../utils/cn'
import { toDateKey } from '../utils/date'

type Mode = 'one' | 'range'

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

export default function HolidaysPage() {
  const uid = useUid()
  const { profile } = useAuth()
  const stats = useStats()

  const today = toDateKey(stats.now)
  const semesterStart = profile?.semesterStartDate ? toDateKey(profile.semesterStartDate) : undefined

  const [mode, setMode] = useState<Mode>('one')
  const [from, setFrom] = useState(today)
  const [to, setTo] = useState(today)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [showErrors, setShowErrors] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [removing, setRemoving] = useState<Holiday | null>(null)
  const [busyRemove, setBusyRemove] = useState(false)

  // A one-day holiday is just a range that ends where it starts.
  const end = mode === 'one' ? from : to
  const errors = validateHoliday(from, end)

  const preview = useMemo(() => {
    if (errors.length) return null
    return {
      days: holidayDays(from, end),
      classes: classesInRange(stats.slots, from, end),
      overridden: marksOverridden(stats.records, from, end),
    }
  }, [errors.length, from, end, stats.slots, stats.records])

  async function save() {
    setShowErrors(true)
    setNotice('')
    if (errors.length) return

    setSaving(true)
    setError('')
    try {
      await addHoliday(uid, { name, from, to: end })
      const off = preview?.classes ?? 0
      setNotice(
        off === 0
          ? 'Added.'
          : `Added. ${plural(off, 'class now counts', 'classes now count')} as no class.`,
      )
      setName('')
      setShowErrors(false)
    } catch {
      setError('Could not add the holiday. Check your connection and try again.')
    } finally {
      setSaving(false)
    }
  }

  async function confirmRemove() {
    if (!removing) return
    setBusyRemove(true)
    try {
      await removeHoliday(uid, removing.id)
      setRemoving(null)
    } catch {
      setError('Could not remove the holiday. Check your connection and try again.')
    } finally {
      setBusyRemove(false)
    }
  }

  return (
    <div className="app-shell px-margin pb-10 pt-3">
      <ScreenHeader title="Holidays" />

      <p className="mt-4 text-body-lg text-on-surface-variant">
        Every class on these days counts as no class, so you never have to mark them one by one.
      </p>

      <div className="card mt-6 flex flex-col gap-4 p-4">
        <ChoiceGrid<Mode>
          label="How long"
          options={[
            { value: 'one', label: 'One day' },
            { value: 'range', label: 'Several days' },
          ]}
          value={mode}
          onChange={(next) => {
            setMode(next)
            // Opening a range should start from the day already picked.
            if (next === 'range' && to < from) setTo(from)
          }}
          columns={2}
        />

        {mode === 'one' ? (
          <Input
            label="Date"
            name="holidayDate"
            type="date"
            min={semesterStart}
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="From"
              name="holidayFrom"
              type="date"
              min={semesterStart}
              value={from}
              onChange={(e) => {
                setFrom(e.target.value)
                // Keep the range the right way round as the start moves.
                if (to < e.target.value) setTo(e.target.value)
              }}
            />
            <Input
              label="To"
              name="holidayTo"
              type="date"
              min={from || semesterStart}
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
        )}

        <Input
          label="Name (optional)"
          name="holidayName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Durga Puja"
          maxLength={40}
        />

        {preview && (
          <p className="text-body-sm text-on-surface-variant">
            {preview.classes === 0
              ? `No classes are scheduled on ${preview.days === 1 ? 'that day' : 'those days'}.`
              : `${plural(preview.classes, 'class', 'classes')} over ${plural(preview.days, 'day', 'days')} will count as no class.`}
          </p>
        )}

        {/* A holiday overrides marks already made, so say so before it happens. */}
        {preview && preview.overridden > 0 && (
          <div className="flex items-start gap-2 border-2 border-warning/40 bg-warning/10 px-3 py-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
            <p className="text-body-sm text-warning">
              {plural(preview.overridden, 'class', 'classes')} you already marked in these days will
              stop counting. If one really ran, add it as a substitution class instead.
            </p>
          </div>
        )}

        {showErrors && errors.length > 0 && (
          <p className="text-body-sm text-error">{errors[0]}</p>
        )}
        {error && <p className="text-body-sm text-error">{error}</p>}
        {notice && <p className="text-body-sm text-primary">{notice}</p>}

        <Button type="button" onClick={() => void save()} loading={saving}>
          <Plus className="h-4 w-4" strokeWidth={3} />
          Add holiday
        </Button>
      </div>

      <h2 className="mb-3 mt-8 font-pixel text-[11px] uppercase tracking-wider text-primary">
        Your holidays
      </h2>

      {stats.holidays.length === 0 ? (
        <div className="flex flex-col items-center gap-2 border-2 border-dashed border-outline-variant py-8 text-center">
          <CalendarOff className="h-7 w-7 text-on-surface-variant" />
          <p className="px-6 text-body-sm text-on-surface-variant">No holidays added yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {stats.holidays.map((h) => {
            const now = h.from <= today && today <= h.to
            const upcoming = h.from > today
            const classes = classesInRange(stats.slots, h.from, h.to)
            return (
              <div
                key={h.id}
                className="flex items-center justify-between gap-3 border-2 border-outline bg-surface-container px-4 py-3"
                style={{ boxShadow: '4px 4px 0 0 #000' }}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-body-lg text-on-surface">{h.name}</p>
                    {(now || upcoming) && (
                      <span
                        className={cn(
                          'chip shrink-0',
                          now ? 'border-primary text-primary' : 'border-outline text-on-surface-variant',
                        )}
                      >
                        {now ? 'On now' : 'Upcoming'}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-body-sm text-on-surface-variant">
                    {formatHolidayRange(h.from, h.to)}
                  </p>
                  <p className="mt-0.5 font-pixel text-[8px] uppercase tracking-wider text-on-surface-variant">
                    {classes === 0 ? 'No classes' : `${plural(classes, 'class', 'classes')} off`}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label={`Remove ${h.name}`}
                  onClick={() => setRemoving(h)}
                  className="shrink-0 text-secondary transition-opacity active:opacity-60"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            )
          })}
        </div>
      )}

      <ConfirmDialog
        open={removing !== null}
        title="Remove holiday?"
        message={
          removing
            ? `Classes ${removing.from === removing.to ? 'on' : 'from'} ${formatHolidayRange(removing.from, removing.to)} will count again, and any you have not marked will count against you.`
            : ''
        }
        confirmLabel="Remove"
        busy={busyRemove}
        onCancel={() => setRemoving(null)}
        onConfirm={() => void confirmRemove()}
      />
    </div>
  )
}
