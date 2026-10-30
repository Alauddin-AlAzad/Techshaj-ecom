import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '../../lib/cn.js'
import { formatPrice } from '../../lib/format.js'

function Highlight({ text, query }) {
  const i = text.toLowerCase().indexOf(query.trim().toLowerCase())
  if (!query.trim() || i < 0) return text
  const end = i + query.trim().length
  return (
    <>
      {text.slice(0, i)}
      <mark className="rounded-[3px] bg-match px-0.5 font-bold text-text">{text.slice(i, end)}</mark>
      {text.slice(end)}
    </>
  )
}

// Shared by the desktop dropdown (39:5294) and the mobile search screen (39:5435).
export default function SearchResults({ query, results, total, onSelect, activeIndex = -1, mobile = false }) {
  const q = query.trim()
  const codeOnly = (p) => !p.name.toLowerCase().includes(q.toLowerCase())

  return (
    <div role="listbox" aria-label="Search results">
      {results.map((p, i) => (
        <Link
          key={p.id}
          to={`/product/${p.slug}`}
          onClick={() => onSelect?.(q)}
          role="option"
          aria-selected={i === activeIndex}
          className={cn(
            'flex items-center gap-3 py-2.5 hover:bg-fill-soft',
            mobile ? 'border-b border-row-line px-4' : 'px-3.5',
            i === activeIndex && 'bg-fill-soft',
          )}
        >
          <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-fill">
            <img src={p.images[0]} alt="" className="size-full object-contain mix-blend-multiply" />
          </span>
          <span className="flex min-w-0 flex-col gap-[3px]">
            <span className={cn('truncate font-medium text-text', mobile ? 'text-[13px]' : 'text-body')}>
              <Highlight text={p.name} query={q} />
            </span>
            <span className="flex items-center gap-2 text-[13px] font-bold text-primary">
              {formatPrice(p.price)}
              {codeOnly(p) && (
                <span className="font-medium text-text-faint">
                  <Highlight text={p.code} query={q} />
                </span>
              )}
            </span>
          </span>
        </Link>
      ))}
      {total > results.length && (
        <Link
          to={`/shop?q=${encodeURIComponent(q)}`}
          onClick={() => onSelect?.(q)}
          role="option"
          aria-selected={activeIndex === results.length}
          className={cn(
            'flex items-center justify-center gap-1.5 py-3 text-[13px] font-bold text-primary',
            mobile ? 'py-3.5' : 'border-t border-border bg-fill-soft',
            activeIndex === results.length && 'underline',
          )}
        >
          View all {total} results
          <ArrowRight size={15} />
        </Link>
      )}
    </div>
  )
}
