import { ClipboardList } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Skeleton } from '../../components/Skeleton.jsx'
import DataTable from '../../components/admin/DataTable.jsx'
import EmptyState from '../../components/admin/EmptyState.jsx'
import ErrorState from '../../components/admin/ErrorState.jsx'
import PageHeader from '../../components/admin/PageHeader.jsx'
import Pagination from '../../components/admin/Pagination.jsx'
import SearchInput from '../../components/admin/SearchInput.jsx'
import StatusBadge from '../../components/admin/StatusBadge.jsx'
import { ORDER_STATUSES, PAYMENT_SHORT, STATUS_LABELS, itemCount } from '../../components/admin/orderMeta.js'
import { useAdminOrders } from '../../hooks/useAdminOrders.js'
import { formatDate, formatPrice } from '../../lib/adminFormat.js'
import { cn } from '../../lib/cn.js'

const PAGE_SIZE = 20
const TABS = [['', 'All'], ...ORDER_STATUSES.map((s) => [s, STATUS_LABELS[s]])]

function PaymentPill({ method }) {
  return <span className="inline-flex rounded-md bg-fill px-2 py-[3px] text-label-sm whitespace-nowrap text-text-secondary">{PAYMENT_SHORT[method] ?? method}</span>
}

const columns = [
  { key: 'orderId', header: 'Order', render: (o) => <span className="font-semibold whitespace-nowrap text-text">#{o.orderId}</span> },
  {
    key: 'customer',
    header: 'Customer',
    render: (o) => (
      <div className="flex flex-col gap-0.5">
        <span className="font-semibold whitespace-nowrap text-text">{o.customer?.name}</span>
        <span className="text-[11px] text-text-faint">{o.customer?.phone ?? o.phone}</span>
      </div>
    ),
  },
  { key: 'area', header: 'Area', render: (o) => <span className="whitespace-nowrap">{o.area ?? '—'}</span> },
  { key: 'items', header: 'Items', align: 'center', render: itemCount },
  { key: 'total', header: 'Total', render: (o) => <span className="font-bold whitespace-nowrap text-text">{formatPrice(o.total)}</span> },
  { key: 'payment', header: 'Payment', render: (o) => <PaymentPill method={o.paymentMethod} /> },
  { key: 'status', header: 'Status', render: (o) => <StatusBadge status={o.status} /> },
  { key: 'date', header: 'Date', render: (o) => <span className="whitespace-nowrap">{formatDate(o.createdAt, { withTime: true })}</span> },
]

// Figma "Orders – Mobile" (64:10547): one card per order.
function OrderCard({ order }) {
  const count = itemCount(order)
  return (
    <Link to={`/admin/orders/${order.orderId}`} className="flex flex-col gap-2 rounded-[14px] border border-border bg-white p-4 active:bg-fill-soft">
      <div className="flex items-center gap-2">
        <span className="text-body-lg font-bold text-text">#{order.orderId}</span>
        <StatusBadge status={order.status} />
      </div>
      <div className="flex items-end justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate text-body font-semibold text-text">{order.customer?.name}</span>
          <span className="text-[13px] text-text-muted">
            {order.customer?.phone ?? order.phone} · {count} {count === 1 ? 'item' : 'items'}
          </span>
          <span className="text-body-sm text-text-faint">{formatDate(order.createdAt, { withTime: true })}</span>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-0.5">
          <span className="text-[17px] font-bold text-text">{formatPrice(order.total)}</span>
          <span className="text-[11px] font-semibold text-text-muted">{PAYMENT_SHORT[order.paymentMethod] ?? order.paymentMethod}</span>
        </div>
      </div>
    </Link>
  )
}

// Figma "Admin – Orders" (56:7823).
export default function Orders() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const status = ORDER_STATUSES.includes(params.get('status')) ? params.get('status') : ''
  const search = params.get('search') ?? ''
  const page = Math.max(Number(params.get('page')) || 1, 1)
  const query = { ...(status && { status }), ...(search && { search }), page, limit: PAGE_SIZE }
  const { data, isLoading, isError, refetch, isFetching } = useAdminOrders(query)

  const setFilter = (key, value) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (value) next.set(key, value)
        else next.delete(key)
        if (key !== 'page') next.delete('page')
        return next
      },
      { replace: key === 'search' },
    )

  const empty = search
    ? { Icon: ClipboardList, title: 'No orders found', text: 'Try another order ID or phone number.', action: { label: 'Clear search', onClick: () => setFilter('search', '') } }
    : { Icon: ClipboardList, title: status ? `No ${STATUS_LABELS[status].toLowerCase()} orders` : 'No orders yet', text: 'Orders appear here as soon as customers place them.' }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Orders" subtitle="All orders appear here as soon as customers place them." />

      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:gap-1 lg:border-b lg:border-border lg:px-0" role="tablist" aria-label="Order status">
        {TABS.map(([value, label]) => {
          const active = status === value
          const count = data?.counts?.[value || 'all']
          return (
            <button
              key={label}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setFilter('status', value)}
              className={cn(
                'flex h-9 shrink-0 items-center gap-1.5 rounded-[18px] border px-3.5 text-[13px] font-semibold whitespace-nowrap transition-colors',
                'lg:-mb-px lg:h-11 lg:rounded-none lg:border-0 lg:border-b-2 lg:px-3',
                active ? 'border-text bg-text text-white lg:border-primary lg:bg-transparent lg:text-text' : 'border-border-strong bg-white text-text-secondary hover:text-text lg:border-transparent lg:bg-transparent',
              )}
            >
              {label}
              {count != null && (
                <span className={cn('rounded-lg px-1.5 py-px text-[11px] font-bold', active ? 'bg-white/20 lg:bg-text lg:text-white' : 'bg-fill text-text-muted')}>{count}</span>
              )}
            </button>
          )
        })}
      </div>

      <SearchInput value={search} onChange={(v) => setFilter('search', v)} placeholder="Search by order ID, name or phone" className="rounded-lg border border-border-strong bg-white lg:max-w-[420px]" />

      {isError ? (
        <div className="rounded-xl border border-border bg-white">
          <ErrorState onRetry={refetch} />
        </div>
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={data?.orders}
            rowKey="orderId"
            loading={isLoading}
            onRowClick={(o) => navigate(`/admin/orders/${o.orderId}`)}
            empty={empty}
            className={cn('max-md:hidden', isFetching && !isLoading && 'opacity-70 transition-opacity')}
          />
          <div className={cn('flex flex-col gap-2.5 md:hidden', isFetching && !isLoading && 'opacity-70')}>
            {isLoading ? (
              Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-[104px] rounded-[14px]" />)
            ) : data?.orders.length ? (
              data.orders.map((o) => <OrderCard key={o.orderId} order={o} />)
            ) : (
              <div className="rounded-xl border border-border bg-white">
                <EmptyState {...empty} />
              </div>
            )}
          </div>
          {data && <Pagination page={page} totalPages={data.totalPages ?? Math.ceil(data.total / PAGE_SIZE)} total={data.total} pageSize={PAGE_SIZE} onChange={(p) => setFilter('page', p > 1 ? String(p) : '')} />}
        </>
      )}
    </div>
  )
}
