import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '../lib/cn.js'

// items: [{ label, to? }]; the last item is the current page.
export default function Breadcrumbs({ items, className }) {
  return (
    <nav aria-label="Breadcrumb" className={cn('flex flex-wrap items-center gap-1.5 text-body-sm lg:text-[13px]', className)}>
      {items.map((item, i) => (
        <Fragment key={item.label}>
          {i > 0 && <span className="text-on-dark" aria-hidden="true">/</span>}
          {item.to && i < items.length - 1 ? (
            <Link to={item.to} className="text-text-muted hover:text-primary">
              {item.label}
            </Link>
          ) : (
            <span aria-current="page" className="font-semibold text-text">
              {item.label}
            </span>
          )}
        </Fragment>
      ))}
    </nav>
  )
}
