import { cn } from '../../lib/cn.js'
import { Skeleton } from '../Skeleton.jsx'
import EmptyState from './EmptyState.jsx'

const align = { left: 'text-left', center: 'text-center', right: 'text-right' }

// Below md each row is a card: the first column (or card: 'title') on top, the rest as label/value lines,
// the 'actions' column (or card: 'actions') at the bottom. card: false hides a column on cards.
function Cards({ columns, rows, keyOf, loading, skeletonRows, onRowClick }) {
  const title = columns.find((c) => c.card === 'title') ?? columns[0]
  const actions = columns.find((c) => c.card === 'actions' || (c.key === 'actions' && c.card !== false))
  const fields = columns.filter((c) => c !== title && c !== actions && c.card !== false)
  const cell = (c, row, i) => (c.render ? c.render(row, i) : row[c.key])

  if (loading) {
    return (
      <ul aria-busy="true" className="flex flex-col gap-2.5">
        {Array.from({ length: skeletonRows }, (_, i) => (
          <li key={i}>
            <Skeleton className="h-[132px] rounded-xl" />
          </li>
        ))}
      </ul>
    )
  }

  return (
    <ul className="flex flex-col gap-2.5">
      {rows.map((row, i) => (
        <li
          key={keyOf(row, i)}
          onClick={onRowClick ? () => onRowClick(row) : undefined}
          className={cn('flex flex-col gap-3 rounded-xl border border-border bg-white p-3.5', onRowClick && 'cursor-pointer active:bg-fill-soft')}
        >
          <div className="min-w-0 text-[13px] text-text-secondary">{cell(title, row, i)}</div>
          {fields.length > 0 && (
            <dl className="grid grid-cols-2 gap-x-3 gap-y-2.5">
              {fields.map((c) => (
                <div key={c.key} className="flex min-w-0 flex-col gap-1">
                  <dt className="text-[11px] font-semibold text-text-muted uppercase">{c.cardLabel ?? c.header}</dt>
                  <dd className="min-w-0 text-[13px] text-text-secondary">{cell(c, row, i)}</dd>
                </div>
              ))}
            </dl>
          )}
          {actions && (
            <div className="border-t border-row-line pt-3 [&>div]:justify-end" onClick={(e) => e.stopPropagation()}>
              {cell(actions, row, i)}
            </div>
          )}
        </li>
      ))}
    </ul>
  )
}

// columns: [{ key, header, render?(row, index), align?, className?, card?, cardLabel? }]. empty: EmptyState props.
export default function DataTable({ columns, rows = [], rowKey = '_id', loading = false, skeletonRows = 5, empty, onRowClick, className }) {
  const keyOf = (row, i) => (typeof rowKey === 'function' ? rowKey(row) : (row[rowKey] ?? i))
  const showEmpty = !loading && rows.length === 0

  return (
    <div className={className}>
      <div className="md:hidden">
        {showEmpty ? (
          <div className="rounded-xl border border-border bg-white">
            <EmptyState {...empty} />
          </div>
        ) : (
          <Cards columns={columns} rows={rows} keyOf={keyOf} loading={loading} skeletonRows={skeletonRows} onRowClick={onRowClick} />
        )}
      </div>
      <div className="overflow-hidden rounded-xl border border-border bg-white max-md:hidden">
        <div className="relative overflow-x-auto">
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
    </div>
  )
}
