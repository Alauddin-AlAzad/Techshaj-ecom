import { cn } from '../../lib/cn.js'

// Figma login inputs (54:7610): 48px tall, 10px radius.
export const inputClass = (error) =>
  cn(
    'h-12 w-full rounded-[10px] border border-border-strong bg-white px-3.5 text-body text-text outline-none placeholder:text-text-faint focus:border-primary disabled:bg-fill-soft disabled:text-text-muted',
    error && 'border-error bg-error-wash focus:border-error',
  )
