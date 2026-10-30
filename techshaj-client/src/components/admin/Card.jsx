import { cn } from '../../lib/cn.js'

// White settings card from Figma "Store Settings" (63:10554): title, optional subtitle and a right-side action.
export default function Card({ title, subtitle, aside, className, children }) {
  return (
    <section className={cn('flex min-w-0 flex-col gap-4 rounded-xl border border-border bg-white p-4 lg:p-5', className)}>
      {(title || aside) && (
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-0.5">
            {title && <h2 className="text-[16px] font-bold text-text">{title}</h2>}
            {subtitle && <p className="text-body-sm text-text-muted">{subtitle}</p>}
          </div>
          {aside}
        </div>
      )}
      {children}
    </section>
  )
}
