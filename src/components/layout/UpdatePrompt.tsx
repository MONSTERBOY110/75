import { useEffect, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { Download, X } from 'lucide-react'

/** How often an open app re-checks the server for a new deploy. */
const CHECK_EVERY_MS = 30 * 60 * 1000

/**
 * Tells students when a new version has been deployed and updates them on one
 * tap. No reloading behind their back and no asking anyone to refresh.
 *
 * The service worker only notices a new deploy when it goes looking, so as well
 * as the check on load this re-checks periodically and whenever the app is
 * brought back to the foreground: an installed PWA can sit open for days.
 */
export function UpdatePrompt() {
  const [dismissed, setDismissed] = useState(false)
  const [updating, setUpdating] = useState(false)

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (!registration) return

      const check = () => void registration.update().catch(() => {})
      const timer = setInterval(check, CHECK_EVERY_MS)

      // Re-check as soon as the app is looked at again.
      const onVisible = () => {
        if (document.visibilityState === 'visible') check()
      }
      document.addEventListener('visibilitychange', onVisible)

      registrationCleanup = () => {
        clearInterval(timer)
        document.removeEventListener('visibilitychange', onVisible)
      }
    },
    onRegisterError(error) {
      console.error('service worker registration failed:', error)
    },
  })

  useEffect(() => () => registrationCleanup?.(), [])

  // A fresh update re-offers itself even if the last one was dismissed.
  useEffect(() => {
    if (needRefresh) setDismissed(false)
  }, [needRefresh])

  /**
   * Hands over to the new worker and reloads onto the new bundle.
   *
   * The reload is driven here rather than left to the library: activating the
   * waiting worker on its own leaves the page running the old JavaScript, and
   * the old worker keeps serving the old shell from its precache until the new
   * one has claimed this page. So wait for the handover, then reload, with a
   * timeout so a missed event can't leave the button spinning forever.
   */
  async function applyUpdate() {
    setUpdating(true)

    let reloaded = false
    const reloadOnce = () => {
      if (reloaded) return
      reloaded = true
      window.location.reload()
    }

    navigator.serviceWorker?.addEventListener('controllerchange', reloadOnce, { once: true })
    const fallback = setTimeout(reloadOnce, 3000)

    try {
      await updateServiceWorker(false)
    } catch {
      clearTimeout(fallback)
      reloadOnce()
    }
  }

  if (!needRefresh || dismissed) return null

  return (
    <div
      role="status"
      className="fixed inset-x-0 top-0 z-40 mx-auto w-full max-w-app px-margin"
      style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}
    >
      <div
        className="flex items-center gap-3 border-2 border-primary bg-surface-container p-3"
        style={{ boxShadow: '4px 4px 0 0 #1b7fa8' }}
      >
        <div className="min-w-0 flex-1">
          <p className="font-pixel text-[9px] uppercase leading-relaxed tracking-wider text-primary">
            New version ready
          </p>
          <p className="mt-1 text-body-sm text-on-surface-variant">
            Update to get the latest features.
          </p>
        </div>

        <button
          type="button"
          disabled={updating}
          onClick={() => void applyUpdate()}
          className="press flex h-11 shrink-0 items-center gap-1.5 border-[3px] border-black bg-primary px-3 font-pixel text-[9px] uppercase tracking-wider text-on-primary disabled:opacity-50"
          style={{ boxShadow: '3px 3px 0 0 #1b7fa8' }}
        >
          <Download className="h-4 w-4" strokeWidth={3} />
          {updating ? 'Updating' : 'Update'}
        </button>

        <button
          type="button"
          aria-label="Dismiss"
          onClick={() => setDismissed(true)}
          className="shrink-0 text-on-surface-variant transition-opacity active:opacity-60"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}

/** Torn down when the prompt unmounts. Module scope because the callback fires once. */
let registrationCleanup: (() => void) | undefined
