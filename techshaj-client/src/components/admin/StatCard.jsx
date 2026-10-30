import { cn } from '../../lib/cn.js'
import { Skeleton } from '../Skeleton.jsx'

// Figma dashboard stat cards (54:7841).
const tones = {
  primary: 'bg-primary-tint text-primary',
  success: 'bg-success-tint text-success',
  highlight: 'bg-highlight-soft text-highlight-ink',
  secondary: 'bg-secondary-tint text-secondary',
  error: 'bg-error-tint text-error',
}

export default function StatCard({ label, value, Icon, tone = 'primary', hint, hintClassName, loading = false }) {
  return (
    <div className="flex min-w-0 flex-col gap-2.5 rounded-xl border border-border bg-white p-3.5 lg:p-[18px]">
      <div className="flex items-start justify-between gap-2 lg:items-center lg:gap-3">
        <p className="text-[13px] font-medium text-text-muted">{label}</p>
        {Icon && (
          <span className={cn('flex size-9 shrink-0 lg:size-[38px] items-center justify-center rounded-[10px]', tones[tone])}>
            <Icon size={19} />
          </span>
        )}
      </div>
      {loading ? <Skeleton className="h-8 w-24" /> : <p className="font-heading text-[22px] font-bold break-words text-text lg:text-[26px]">{value}</p>}
      {hint && <p className={cn('text-label-sm text-text-muted', hintClassName)}>{hint}</p>}
    </div>
  )
}
