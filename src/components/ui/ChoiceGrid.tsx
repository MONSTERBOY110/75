import { cn } from '../../utils/cn'

export interface Choice<T extends string | number> {
  value: T
  label: string
}

/** A row of chunky pixel toggles - the theme's answer to a <select>. */
export function ChoiceGrid<T extends string | number>({
  label,
  options,
  value,
  onChange,
  columns = 4,
  className,
}: {
  label?: string
  options: Choice<T>[]
  value: T
  onChange: (value: T) => void
  columns?: number
  className?: string
}) {
  return (
    <div className={className}>
      {label && <span className="field-label">{label}</span>}
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {options.map((option) => {
          const active = option.value === value
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(option.value)}
              className={cn(
                'press flex h-12 items-center justify-center border-2 px-2 font-pixel text-[10px] uppercase tracking-wider',
                active
                  ? 'border-black bg-primary text-on-primary'
                  : 'border-outline bg-surface-container-high text-on-surface-variant',
              )}
              style={{ boxShadow: active ? '3px 3px 0 0 #1b7fa8' : '3px 3px 0 0 #000' }}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
