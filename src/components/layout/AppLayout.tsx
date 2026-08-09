import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'

export function AppLayout() {
  return (
    <div className="app-shell">
      {/* Bottom padding clears the floating nav plus the raised home dial. */}
      <main className="flex-1 px-margin pb-36 pt-3">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
