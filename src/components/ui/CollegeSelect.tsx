import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, Plus, Search, X } from 'lucide-react'
import type { College } from '../../types'
import { cn } from '../../utils/cn'
import { collegeNameKey } from '../../utils/collegeName'
import { Spinner } from './Spinner'

/**
 * College picker. The list grows every time a student contributes a routine, so
 * it opens as a searchable sheet rather than printing every name on the form.
 */
export function CollegeSelect({
  colleges,
  loading,
  value,
  onChange,
  onAddOwn,
}: {
  colleges: College[]
  loading: boolean
  value: string
  onChange: (collegeId: string) => void
  onAddOwn: () => void
}) {
  const [open, setOpen] = useState(false)
  const [term, setTerm] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  const selected = colleges.find((c) => c.id === value)

  useEffect(() => {
    if (!open) return
    setTerm('')
    // Let the sheet paint before stealing focus, or mobile keyboards fight it.
    const id = setTimeout(() => searchRef.current?.focus(), 60)

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      clearTimeout(id)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const results = useMemo(() => {
    // Match on the same punctuation-free key used to dedupe names, so searching
    // "bp poddar" still finds "B.P. Poddar".
    const key = collegeNameKey(term)
    if (!key) return colleges
    return colleges.filter((c) => c.nameKey.includes(key) || collegeNameKey(c.name).includes(key))
  }, [colleges, term])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className={cn(
          'press flex min-h-14 w-full items-center justify-between gap-3 border-2 px-4 py-3 text-left',
          selected
            ? 'border-black bg-primary text-on-primary'
            : 'border-outline bg-surface-container-high text-on-surface-variant',
        )}
        style={{ boxShadow: selected ? '4px 4px 0 0 #1b7fa8' : '4px 4px 0 0 #000' }}
      >
        <span className="text-body-lg leading-snug">
          {selected ? selected.name : 'Choose your college'}
        </span>
        <ChevronDown className="h-5 w-5 shrink-0" strokeWidth={2.5} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Choose your college"
            className="flex max-h-[85vh] w-full max-w-app flex-col border-t-2 border-outline bg-surface-container"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 px-5 pt-5">
              <h2 className="font-pixel text-[11px] uppercase tracking-wider text-primary">
                Your college
              </h2>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setOpen(false)}
                className="text-on-surface-variant transition-opacity active:opacity-60"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="relative px-5 pt-4">
              <Search className="pointer-events-none absolute left-8 top-1/2 h-5 w-5 -translate-y-1/2 text-on-surface-variant" />
              <input
                ref={searchRef}
                type="search"
                className="input pl-11"
                placeholder="Search colleges"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
              />
            </div>

            <div
              className="mt-4 flex-1 overflow-y-auto px-5"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {loading ? (
                <div className="flex justify-center py-10">
                  <Spinner />
                </div>
              ) : results.length === 0 ? (
                <div className="border-2 border-dashed border-outline-variant p-6 text-center">
                  <p className="text-body-sm text-on-surface-variant">
                    No college matches "{term.trim()}".
                  </p>
                  <p className="mt-1 text-body-sm text-on-surface-variant">
                    Add it below and everyone there can use it.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2 pb-2">
                  {results.map((college) => {
                    const active = college.id === value
                    return (
                      <button
                        key={college.id}
                        type="button"
                        onClick={() => {
                          onChange(college.id)
                          setOpen(false)
                        }}
                        className={cn(
                          'flex min-h-12 w-full items-center justify-between gap-3 border-2 px-4 py-2 text-left transition-colors',
                          active
                            ? 'border-primary bg-primary/15 text-primary'
                            : 'border-outline bg-surface-container-high text-on-surface',
                        )}
                      >
                        <span className="text-body-lg leading-snug">{college.name}</span>
                        {active && <Check className="h-5 w-5 shrink-0" strokeWidth={3} />}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <div
              className="border-t-2 border-outline-variant p-5"
              style={{ paddingBottom: 'max(20px, env(safe-area-inset-bottom))' }}
            >
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  onAddOwn()
                }}
                className="press flex min-h-14 w-full items-center justify-center gap-2 border-2 border-dashed border-primary bg-transparent px-4 font-pixel text-[10px] uppercase tracking-wider text-primary"
              >
                <Plus className="h-4 w-4" strokeWidth={3} />
                Add your college
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
