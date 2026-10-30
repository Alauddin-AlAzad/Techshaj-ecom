import ShopPagination from '../shop/Pagination.jsx'

// "Showing 21–40 of 132" plus the storefront page buttons.
export default function Pagination({ page, totalPages, total, pageSize, onChange }) {
  if (!total && totalPages < 2) return null
  const from = total ? (page - 1) * pageSize + 1 : 0
  const to = total ? Math.min(page * pageSize, total) : 0
  return (
    <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
      {total > 0 && pageSize && (
        <p className="text-[13px] text-text-muted">
          Showing {from}–{to} of {total}
        </p>
      )}
      <ShopPagination page={page} total={totalPages} onChange={onChange} />
    </div>
  )
}
