import { useEffect } from 'react'

/**
 * Modal confirmation dialog in the retro-arcade style (hard edges, pixel shadow).
 * Backdrop tap and Escape both cancel; `busy` locks every way out while a write
 * is in flight so the action can't be dismissed or double-fired.
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  message: string
  confirmLabel: string
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  useEffect(() => {
    if (!open) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !busy) onCancel()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, busy, onCancel])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6"
      onClick={() => {
        if (!busy) onCancel()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-sm border-2 border-outline bg-surface-container p-5 shadow-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-title-md font-semibold text-on-surface">{title}</h2>
        <p className="mt-2 text-body-sm text-on-surface-variant">{message}</p>
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="flex h-11 flex-1 items-center justify-center bg-surface-container-high text-body-sm font-semibold text-on-surface transition-transform active:scale-[0.98] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="flex h-11 flex-1 items-center justify-center bg-primary text-body-sm font-semibold text-on-primary transition-transform active:scale-[0.98] disabled:opacity-50"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
