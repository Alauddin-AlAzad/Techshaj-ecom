import { CircleCheck, CircleX, ExternalLink, MessageSquareText, Star } from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Skeleton } from '../../components/Skeleton.jsx'
import Button from '../../components/admin/Button.jsx'
import ConfirmDialog from '../../components/admin/ConfirmDialog.jsx'
import EmptyState from '../../components/admin/EmptyState.jsx'
import ErrorState from '../../components/admin/ErrorState.jsx'
import PageHeader from '../../components/admin/PageHeader.jsx'
import Pagination from '../../components/admin/Pagination.jsx'
import Tabs from '../../components/admin/Tabs.jsx'
import { useAdminReviews, useModerateReview } from '../../hooks/useAdminReviews.js'
import { formatDate } from '../../lib/adminFormat.js'
import { cn } from '../../lib/cn.js'
import { notify } from '../../lib/notify.jsx'
import { errorMessage } from '../../lib/query.js'

const PAGE_SIZE = 10
const STATUSES = [
  { value: 'pending', label: 'Pending', empty: 'No reviews are waiting. New reviews show up here first.' },
  { value: 'approved', label: 'Approved', empty: 'Approved reviews show on product pages.' },
  { value: 'rejected', label: 'Rejected', empty: 'Rejected reviews stay hidden from customers.' },
]

function Stars({ rating }) {
  return (
    <span className="flex items-center gap-0.5" role="img" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={14} className={i < Math.round(rating) ? 'fill-highlight text-highlight' : 'fill-border-strong text-border-strong'} />
      ))}
    </span>
  )
}

// Seeded reviews have no status and count as approved, like on the server.
const statusOf = (r) => (r.status === 'pending' || r.status === 'rejected' ? r.status : 'approved')

function ReviewCard({ review, busy, onApprove, onReject }) {
  const status = statusOf(review)
  return (
    <li className="flex flex-col gap-3 rounded-xl border border-border bg-white p-4 lg:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-[14px] font-bold text-text">{review.name || 'Customer'}</span>
          <span className="flex flex-wrap items-center gap-2 text-body-sm text-text-muted">
            <Stars rating={review.rating ?? 0} />
            <span aria-hidden="true">•</span>
            {formatDate(review.createdAt ?? review.date, { withTime: Boolean(review.createdAt) })}
          </span>
        </div>
        {review.product ? (
          <a
            href={`/product/${review.product.slug}`}
            target="_blank"
            rel="noreferrer"
            className="flex max-w-full items-center gap-2 rounded-lg border border-border bg-fill-soft px-2.5 py-1.5 text-[12px] font-semibold text-text-secondary hover:text-text"
          >
            <span className="truncate">{review.product.name}</span>
            <ExternalLink size={13} className="shrink-0" />
          </a>
        ) : (
          <span className="rounded-lg bg-fill px-2.5 py-1.5 text-[12px] text-text-muted">Product #{review.productId} (deleted)</span>
        )}
      </div>

      <div className="flex flex-col gap-1">
        {review.title && <p className="text-[14px] font-semibold text-text">{review.title}</p>}
        <p className="text-[14px] whitespace-pre-line text-text-secondary">{review.text}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {status !== 'approved' && (
          <Button Icon={CircleCheck} onClick={onApprove} loading={busy === 'approved'} disabled={Boolean(busy)} className="h-11 bg-success md:h-9 hover:bg-success hover:opacity-90">
            Approve
          </Button>
        )}
        {status !== 'rejected' && (
          <Button variant="secondary" Icon={CircleX} onClick={onReject} disabled={Boolean(busy)} className="h-11 text-error hover:border-error md:h-9">
            Reject
          </Button>
        )}
        {review.reviewedAt && <span className="text-body-sm text-text-faint">Reviewed {formatDate(review.reviewedAt, { withTime: true })}</span>}
      </div>
    </li>
  )
}

// Figma "Admin – Reviews" (62:10260).
export default function Reviews() {
  const [params, setParams] = useSearchParams()
  const status = STATUSES.some((s) => s.value === params.get('status')) ? params.get('status') : 'pending'
  const page = Math.max(Number(params.get('page')) || 1, 1)
  const { data, isLoading, isError, refetch, isFetching } = useAdminReviews({ status, page, limit: PAGE_SIZE })
  const moderate = useModerateReview()
  const [rejecting, setRejecting] = useState(null)
  const current = STATUSES.find((s) => s.value === status)

  const setQuery = (next) => setParams(Object.fromEntries(Object.entries({ status, page: String(page), ...next }).filter(([k, v]) => v && !(k === 'page' && v === '1'))))

  const decide = (review, next) =>
    moderate.mutate(
      { id: review._id, status: next },
      {
        onSuccess: () => {
          notify.success(next === 'approved' ? 'Review approved' : 'Review rejected', { description: next === 'approved' ? 'It now shows on the product page.' : 'It is hidden from customers.' })
          setRejecting(null)
          if (data?.reviews.length === 1 && page > 1) setQuery({ page: String(page - 1) })
        },
        onError: (error) => notify.error('Could not update the review', { description: errorMessage(error) }),
      },
    )

  const busyFor = (review) => (moderate.isPending && moderate.variables?.id === review._id ? moderate.variables.status : null)

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Reviews" subtitle="New reviews wait here until you approve them." />

      <Tabs
        label="Review status"
        tabs={STATUSES.map((s) => ({ value: s.value, label: s.label, count: s.value === status && data ? data.total : undefined }))}
        value={status}
        onChange={(s) => setQuery({ status: s, page: '1' })}
      />

      {isLoading ? (
        <div role="status" aria-label="Loading" className="flex flex-col gap-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-[170px] rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-border bg-white">
          <ErrorState title="Could not load reviews" onRetry={refetch} />
        </div>
      ) : data.reviews.length === 0 ? (
        <div className="rounded-xl border border-border bg-white">
          <EmptyState Icon={MessageSquareText} title={`No ${current.label.toLowerCase()} reviews`} text={current.empty} />
        </div>
      ) : (
        <>
          <ul className={cn('flex flex-col gap-3', isFetching && 'opacity-70 transition-opacity')}>
            {data.reviews.map((r) => (
              <ReviewCard key={r._id} review={r} busy={busyFor(r)} onApprove={() => decide(r, 'approved')} onReject={() => setRejecting(r)} />
            ))}
          </ul>
          <Pagination page={page} totalPages={data.totalPages} total={data.total} pageSize={PAGE_SIZE} onChange={(p) => setQuery({ page: String(p) })} />
        </>
      )}

      <ConfirmDialog
        open={Boolean(rejecting)}
        onClose={() => setRejecting(null)}
        onConfirm={() => decide(rejecting, 'rejected')}
        loading={moderate.isPending}
        danger
        title="Reject this review?"
        message={rejecting && `The review by ${rejecting.name || 'this customer'} will be hidden from the product page and left out of its rating. You can approve it later from the Rejected tab.`}
        confirmLabel="Reject"
        cancelLabel="Keep it"
      />
    </div>
  )
}
