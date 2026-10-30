import { TriangleAlert } from 'lucide-react'
import { cn } from '../../lib/cn.js'

// Wraps one input: <FormField label="Email" htmlFor="email" error={errors.email?.message}><input id="email" … /></FormField>
export default function FormField({ label, htmlFor, error, hint, required = false, className, children }) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={htmlFor} className="text-[13px] font-semibold text-text">
          {label}
          {required && <span className="text-error"> *</span>}
        </label>
      )}
      {children}
      {error ? (
        <p role="alert" className="flex items-center gap-[5px] text-body-sm font-medium text-error">
          <TriangleAlert size={13} className="shrink-0" />
          {error}
        </p>
      ) : (
        hint && <p className="text-body-sm text-text-muted">{hint}</p>
      )}
    </div>
  )
}
