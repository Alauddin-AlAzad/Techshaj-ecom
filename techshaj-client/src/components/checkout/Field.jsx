import { TriangleAlert } from 'lucide-react'
import { cn } from '../../lib/cn.js'

export function FieldError({ message, className }) {
  if (!message) return null
  return (
    <p role="alert" className={cn('flex items-center gap-[5px] font-bangla text-body-sm font-medium text-error', className)}>
      <TriangleAlert size={13} className="shrink-0" />
      {message}
    </p>
  )
}

// Bangla-labelled input from the checkout frames, with the error state from 86:15837.
export default function Field({ label, error, multiline = false, className, ...props }) {
  const Input = multiline ? 'textarea' : 'input'
  return (
    <label className={cn('flex flex-col gap-1.5', className)}>
      <span className="font-bangla text-[13px] font-semibold text-text lg:text-label">{label}</span>
      <Input
        aria-invalid={Boolean(error)}
        className={cn(
          'w-full rounded-lg border border-border-strong bg-white p-3 font-bangla text-[13px] text-text outline-none placeholder:text-text-faint focus:border-primary lg:px-3.5',
          multiline ? 'h-[72px] resize-none lg:h-[76px]' : 'h-11',
          error && 'border-[1.5px] border-error bg-error-wash focus:border-error',
        )}
        {...props}
      />
      <FieldError message={error} />
    </label>
  )
}
