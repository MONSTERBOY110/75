import { Loader2 } from 'lucide-react'
import { cn } from '../../utils/cn'

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('h-6 w-6 animate-spin text-primary', className)} />
}

/** Full-screen branded loading state used while auth resolves. */
export function FullScreenLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Spinner className="h-8 w-8" />
    </div>
  )
}
