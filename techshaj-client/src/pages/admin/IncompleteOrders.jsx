import { CircleCheck, EyeOff, Phone, PhoneMissed, RotateCcw, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { FaWhatsapp } from 'react-icons/fa'
import { useSearchParams } from 'react-router-dom'
import { Skeleton } from '../../components/Skeleton.jsx'
import Button from '../../components/admin/Button.jsx'
import ConfirmDialog from '../../components/admin/ConfirmDialog.jsx'
import EmptyState from '../../components/admin/EmptyState.jsx'
import ErrorState from '../../components/admin/ErrorState.jsx'
import PageHeader from '../../components/admin/PageHeader.jsx'
import Pagination from '../../components/admin/Pagination.jsx'
import Tabs from '../../components/admin/Tabs.jsx'
import { useAdminIncompleteOrders, useDeleteIncompleteOrder, useUpdateIncompleteOrder } from '../../hooks/useAdminIncompleteOrders.js'
import { formatDate } from '../../lib/adminFormat.js'
import { cn } from '../../lib/cn.js'
import { formatPrice } from '../../lib/format.js'
import { notify } from '../../lib/notify.jsx'
import { errorMessage } from '../../lib/query.js'

const PAGE_SIZE = 10
const STATUSES = [
  { value: 'new', label: 'To call', empty: 'Customers who type a phone number at checkout but do not place the order show up here.' },
  { value: 'called', label: 'Called', empty: 'Mark a customer as called after you contact them.' },
  { value: 'ignored', label: 'Ignored', empty: 'Ignored entries stay here until they are deleted.' },
]

function LeadCard({ lead, busy, onStatus, onDelete }) {
  const variantText = (variant) => Object.values(variant ?? {}).join(', ')
  return (
    <li className="flex flex-col gap-3 rounded-xl border border-border bg-white p-4 lg:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-[14px] font-bold text-text">{lead.name || 'No name given'}</span>
          <a href={`tel:${lead.phone}`} className="text-[14px] font-semibold text-primary">
            {lead.phone}
          </a>
          <span className="text-body-sm text-text-muted">
            {formatDate(lead.updatedAt, { withTime: true })}
            {lead.area && ` • ${lead.area}`}
          </span>
        </div>
        {lead.subtotal > 0 && <span className="text-[15px] font-bold text-text">{formatPrice(lead.subtotal)}</span>}
      </div>

      {lead.address && <p className="text-[13px] whitespace-pre-line text-text-secondary">{lead.address}</p>}

      {lead.items?.length > 0 && (
        <ul className="flex flex-col gap-1.5 rounded-lg bg-fill-soft p-3">
          {lead.items.map((item, i) => (
            <li key={i} className="flex items-center gap-2.5 text-[13px]">
              {item.image && <img src={item.image} alt="" className="size-9 shrink-0 rounded-md object-cover" />}
              <span className="min-w-0 flex-1 text-text">
                <a href={`/product/${item.slug}`} target="_blank" rel="noreferrer" className="line-clamp-1 hover:underline">
                  {item.name}
                </a>
                {variantText(item.variant) && <span className="text-text-muted"> · {variantText(item.variant)}</span>}
              </span>
              <span className="shrink-0 text-text-muted">
                {item.quantity} × {formatPrice(item.price)}
              </span>
            </li>
          ))}
        </ul>
      )}

      {lead.note && <p className="text-body-sm text-text-muted">Note: {lead.note}</p>}

      <div className="flex flex-wrap items-center gap-2.5">
        <Button Icon={Phone} onClick={() => (window.location.href = `tel:${lead.phone}`)} className="h-11 md:h-9">
          Call
        </Button>
        <a
          href={`https://wa.me/88${lead.phone}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-11 items-center gap-2 rounded-lg border border-border-strong bg-white px-4 text-[13px] font-semibold text-text hover:border-text-faint md:h-9"
        >
          <FaWhatsapp size={16} className="text-whatsapp-ink" />
          WhatsApp
        </a>
        {lead.status !== 'called' && (
          <Button variant="secondary" Icon={CircleCheck} onClick={() => onStatus('called')} loading={busy === 'called'} disabled={Boolean(busy)} className="h-11 md:h-9">
            Mark called
          </Button>
        )}
        {lead.status !== 'ignored' && (
          <Button variant="ghost" Icon={EyeOff} onClick={() => onStatus('ignored')} loading={busy === 'ignored'} disabled={Boolean(busy)} className="h-11 md:h-9">
            Ignore
          </Button>
        )}
        {lead.status !== 'new' && (
          <Button variant="ghost" Icon={RotateCcw} onClick={() => onStatus('new')} loading={busy === 'new'} disabled={Boolean(busy)} className="h-11 md:h-9">
            Back to call list
          </Button>
        )}
        <Button variant="ghost" Icon={Trash2} onClick={onDelete} disabled={Boolean(busy)} className="h-11 text-error md:ml-auto md:h-9">
          Delete
        </Button>
      </div>
    </li>
  )
}

export default function IncompleteOrders() {
  const [params, setParams] = useSearchParams()
  const status = STATUSES.some((s) => s.value === params.get('status')) ? params.get('status') : 'new'
  const page = Math.max(Number(params.get('page')) || 1, 1)
  const { data, isLoading, isError, refetch, isFetching } = useAdminIncompleteOrders({ status, page, limit: PAGE_SIZE })
  const update = useUpdateIncompleteOrder()
  const remove = useDeleteIncompleteOrder()
  const [deleting, setDeleting] = useState(null)
  const current = STATUSES.find((s) => s.value === status)

  const setQuery = (next) => setParams(Object.fromEntries(Object.entries({ status, page: String(page), ...next }).filter(([k, v]) => v && !(k === 'page' && v === '1'))))
  const afterChange = () => data?.orders.length === 1 && page > 1 && setQuery({ page: String(page - 1) })

  const setStatus = (lead, next) =>
    update.mutate(
      { id: lead._id, status: next },
      {
        onSuccess: () => {
          notify.success(next === 'called' ? 'Marked as called' : next === 'ignored' ? 'Moved to Ignored' : 'Moved back to the call list')
          afterChange()
        },
        onError: (error) => notify.error('Could not update', { description: errorMessage(error) }),
      },
    )

  const confirmDelete = () =>
    remove.mutate(deleting._id, {
      onSuccess: () => {
        notify.success('Deleted')
        setDeleting(null)
        afterChange()
      },
      onError: (error) => notify.error('Could not delete', { description: errorMessage(error) }),
    })

  const busyFor = (lead) => (update.isPending && update.variables?.id === lead._id ? update.variables.status : null)

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Incomplete orders"
        subtitle="Customers who typed their phone number at checkout but did not place the order. Entries are removed when they order, or after 30 days."
      />

      <Tabs label="Incomplete order status" tabs={STATUSES.map((s) => ({ value: s.value, label: s.label, count: data?.counts?.[s.value] }))} value={status} onChange={(s) => setQuery({ status: s, page: '1' })} />

      {isLoading ? (
        <div role="status" aria-label="Loading" className="flex flex-col gap-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-[190px] rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-border bg-white">
          <ErrorState title="Could not load incomplete orders" onRetry={refetch} />
        </div>
      ) : data.orders.length === 0 ? (
        <div className="rounded-xl border border-border bg-white">
          <EmptyState Icon={PhoneMissed} title="Nothing here" text={current.empty} />
        </div>
      ) : (
        <>
          <ul className={cn('flex flex-col gap-3', isFetching && 'opacity-70 transition-opacity')}>
            {data.orders.map((lead) => (
              <LeadCard key={lead._id} lead={lead} busy={busyFor(lead)} onStatus={(next) => setStatus(lead, next)} onDelete={() => setDeleting(lead)} />
            ))}
          </ul>
          <Pagination page={page} totalPages={data.totalPages} total={data.total} pageSize={PAGE_SIZE} onChange={(p) => setQuery({ page: String(p) })} />
        </>
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        loading={remove.isPending}
        danger
        title="Delete this entry?"
        message={deleting && `${deleting.name || deleting.phone} will be removed from the list. This cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Keep it"
      />
    </div>
  )
}
