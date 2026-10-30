import { cn } from '../../lib/cn.js'

function pages(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const around = [current - 1, current, current + 1].filter((p) => p > 1 && p < total)
  return [1, around[0] > 2 && '…', ...around, around.at(-1) < total - 1 && '…', total].filter(Boolean)
}

const box = 'flex size-9 items-center justify-center rounded-lg text-label'

export default function Pagination({ page, total, onChange }) {
  if (total < 2) return null
  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-2 pt-3">
      <button type="button" disabled={page === 1} onClick={() => onChange(page - 1)} aria-label="Previous page" className={cn(box, 'border border-border-strong text-text-secondary disabled:opacity-40')}>
        ‹
      </button>
      {pages(page, total).map((p, i) =>
        p === '…' ? (
          <span key={`gap${i}`} className={cn(box, 'border border-border-strong text-text-secondary')}>
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            aria-current={p === page ? 'page' : undefined}
            className={cn(box, p === page ? 'bg-text text-white' : 'border border-border-strong text-text-secondary hover:border-text')}
          >
            {p}
          </button>
        ),
      )}
      <button type="button" disabled={page === total} onClick={() => onChange(page + 1)} aria-label="Next page" className={cn(box, 'border border-border-strong text-text-secondary disabled:opacity-40')}>
        ›
      </button>
    </nav>
  )
}
