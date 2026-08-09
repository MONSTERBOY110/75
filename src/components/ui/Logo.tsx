import { Check } from 'lucide-react'
import { cn } from '../../utils/cn'

/** The brand mark: a chunky tick in a raised pixel box. */
export function Logo({ size = 64, className }: { size?: number; className?: string }) {
  return (
    <div
      className={cn(
        'inline-flex items-center justify-center border-[3px] border-primary bg-surface-container',
        className,
      )}
      style={{ width: size, height: size, boxShadow: '6px 6px 0 0 #000' }}
      aria-hidden="true"
    >
      <Check className="text-primary" style={{ width: size * 0.55, height: size * 0.55 }} strokeWidth={3} />
    </div>
  )
}
