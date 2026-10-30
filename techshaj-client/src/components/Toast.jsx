import { BadgePercent, CircleCheck, CircleX, Heart } from 'lucide-react'
import { cn } from '../lib/cn.js'

// Figma "Toast Variants" (86:16071).
const variants = {
  success: { Icon: CircleCheck, icon: 'bg-success-tint text-success', action: 'text-toast-action' },
  wish: { Icon: Heart, icon: 'bg-primary-tint text-primary', action: 'text-toast-action' },
  info: { Icon: BadgePercent, icon: 'bg-primary-tint text-primary', action: 'text-toast-action' },
  error: { Icon: CircleX, icon: 'bg-error-tint text-error', action: 'text-toast-action-error' },
}

export default function Toast({ variant, title, description, action, onAction }) {
  const { Icon, icon, action: actionColor } = variants[variant]
  return (
    <div className="flex w-full items-center gap-3 rounded-xl bg-text py-3 pr-3.5 pl-3 font-body shadow-toast lg:w-[380px]">
      <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-[10px]', icon)}>
        <Icon size={18} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-label text-white">{title}</span>
        {description && <span className="truncate text-body-sm text-toast-copy">{description}</span>}
      </span>
      {action && (
        <button type="button" onClick={onAction} className={cn('shrink-0 text-[13px] font-semibold whitespace-nowrap', actionColor)}>
          {action.label}
        </button>
      )}
    </div>
  )
}
