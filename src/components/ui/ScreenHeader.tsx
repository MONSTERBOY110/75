import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { cn } from '../../utils/cn'

interface ScreenHeaderProps {
  /** Centered title. When omitted, only the controls row is rendered. */
  title?: string
  showBack?: boolean
  onBack?: () => void
  trailing?: ReactNode
  className?: string
}

/** Compact top bar: back arrow, optional pixel title, optional trailing slot. */
export function ScreenHeader({
  title,
  showBack = true,
  onBack,
  trailing,
  className,
}: ScreenHeaderProps) {
  const navigate = useNavigate()
  return (
    <div className={cn('flex h-12 items-center justify-between gap-2', className)}>
      <div className="flex w-10 shrink-0 items-center">
        {showBack && (
          <button
            type="button"
            aria-label="Go back"
            onClick={() => (onBack ? onBack() : navigate(-1))}
            className="text-primary transition-opacity active:opacity-60"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
        )}
      </div>
      {title && <h1 className="wordmark truncate text-[15px]">{title}</h1>}
      <div className="flex w-10 shrink-0 items-center justify-end">{trailing}</div>
    </div>
  )
}
