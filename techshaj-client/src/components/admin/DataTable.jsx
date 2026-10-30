import { cn } from '../../lib/cn.js'
import { Skeleton } from '../Skeleton.jsx'
import EmptyState from './EmptyState.jsx'

const align = { left: 'text-left', center: 'text-center', right: 'text-right' }

// columns: [{ key, header, render?(row, index), align?, className? }]. empty: EmptyState props.
export default function DataTable({ columns, rows = [], rowKey = '_id', loading = false, skeletonRows = 5, empty, onRowClick, className }) {
  const keyOf = (row, i) => (typeof rowKey === 'function' ? rowKey(row) : (row[rowKey] ?? i))
  const showEmpty = !loading && rows.length === 0

  return (
    <div className={cn('overflow-hidden rounded-xl border border-border bg-white', className)}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse">
          <thead>
            <tr className="border-b border-border bg-fill-soft">
              {columns.map((c) => (
                <th key={c.key} scope="col" className={cn('px-4 py-3 text-[11px] font-semibold whitespace-nowrap text-text-muted uppercase', align[c.align ?? 'left'], c.className)}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody aria-busy={loading || undefined}>
            {loading
              ? Array.from({ length: skeletonRows }, (_, i) => (
                  <tr key={i} className="border-b border-row-line last:border-b-0">
                    {columns.map((c) => (
                      <td key={c.key} className="px-4 py-3.5">
                        <Skeleton className="h-4 w-full max-w-[120px]" />
                      </td>
                    ))}
                  </tr>
                ))
              : rows.map((row, i) => (
                  <tr
                    key={keyOf(row, i)}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    onKeyDown={onRowClick ? (e) => e.key === 'Enter' && onRowClick(row) : undefined}
                    tabIndex={onRowClick ? 0 : undefined}
                    className={cn('border-b border-row-line last:border-b-0', onRowClick && 'cursor-pointer outline-none hover:bg-fill-soft focus-visible:bg-fill-soft')}
                  >
                    {columns.map((c) => (
                      <td key={c.key} className={cn('px-4 py-3 text-[13px] text-text-secondary', align[c.align ?? 'left'], c.className)}>
                        {c.render ? c.render(row, i) : row[c.key]}
                      </td>
                    ))}
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
      {showEmpty && <EmptyState {...empty} />}
    </div>
  )
}
