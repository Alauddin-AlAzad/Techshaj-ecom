import { ChevronRight, ClipboardList, Clock, ImageOff, Plus, TriangleAlert, Wallet } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Skeleton } from '../../components/Skeleton.jsx'
import Button from '../../components/admin/Button.jsx'
import ErrorState from '../../components/admin/ErrorState.jsx'
import StatCard from '../../components/admin/StatCard.jsx'
import StatusBadge from '../../components/admin/StatusBadge.jsx'
import { useAdminDashboard } from '../../hooks/useAdminOrders.js'
import { formatDate, formatPrice } from '../../lib/adminFormat.js'
import { cn } from '../../lib/cn.js'

const TIME_ZONE = 'Asia/Dhaka'
const weekday = new Intl.DateTimeFormat('en-GB', { timeZone: TIME_ZONE, weekday: 'short' })
const longDay = new Intl.DateTimeFormat('en-GB', { timeZone: TIME_ZONE, weekday: 'long', day: 'numeric', month: 'short' })
const dhakaHour = () => Number(new Intl.DateTimeFormat('en-GB', { timeZone: TIME_ZONE, hour: 'numeric', hourCycle: 'h23' }).format(new Date()))

// "2026-10-30" is a Dhaka calendar day; noon keeps it on that day in any formatter.
const dayDate = (key) => new Date(`${key}T12:00:00+06:00`)

const greeting = () => {
  const h = dhakaHour()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

// ৳48,350 -> ৳48k on the axis
const shortTaka = (n) => (n >= 1000 ? `৳${Math.round(n / 100) / 10}k` : `৳${n}`)

function Panel({ title, action, className, children }) {
  return (
    <section className={cn('flex min-w-0 flex-col gap-3.5 rounded-xl border border-border bg-white p-4 lg:p-5', className)}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-body text-body-lg font-bold text-text">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

function ViewAll({ to, label = 'View all' }) {
  return (
    <Link to={to} className="flex items-center gap-1 text-[13px] font-semibold text-primary">
      {label}
      <ChevronRight size={14} />
    </Link>
  )
}

function Thumb({ src }) {
  const [failed, setFailed] = useState(false)
  return (
    <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-fill text-text-faint">
      {src && !failed ? <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} className="size-full object-cover" /> : <ImageOff size={16} />}
    </span>
  )
}

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="rounded-lg bg-text px-3 py-2 text-body-sm text-white shadow-toast">
      <p className="font-semibold">{longDay.format(dayDate(d.date))}</p>
      <p>
        {formatPrice(d.sales)} · {d.orders} {d.orders === 1 ? 'order' : 'orders'}
      </p>
    </div>
  )
}

function SalesChart({ days }) {
  const total = days.reduce((sum, d) => sum + d.sales, 0)
  const orders = days.reduce((sum, d) => sum + d.orders, 0)
  const data = days.map((d) => ({ ...d, label: weekday.format(dayDate(d.date)) }))
  return (
    <Panel
      title="Sales, last 7 days"
      className="lg:col-span-2"
      action={
        <span className="flex items-center gap-1.5 text-body-sm text-text-muted">
          <span className="size-2 rounded-sm bg-primary" />
          Sales (৳)
        </span>
      }
    >
      <p className="-mt-2.5 text-body-sm text-text-muted">
        {formatPrice(total)} total · {orders} {orders === 1 ? 'order' : 'orders'}
      </p>
      <div className="h-[240px] [&_.recharts-cartesian-axis-tick-value]:fill-text-muted [&_.recharts-cartesian-grid_line]:stroke-border">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 0, bottom: 0, left: -8 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={shortTaka} tickLine={false} axisLine={false} tick={{ fontSize: 11 }} width={52} allowDecimals={false} />
            <Tooltip content={<ChartTooltip />} cursor={{ className: 'fill-primary-wash' }} />
            <Bar dataKey="sales" radius={[6, 6, 0, 0]} maxBarSize={40}>
              {data.map((d, i) => (
                <Cell key={d.date} className={i === data.length - 1 ? 'fill-primary' : 'fill-primary-soft'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  )
}

function DashboardSkeleton() {
  return (
    <div role="status" aria-label="Loading" className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-[118px] rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-[320px] rounded-xl lg:col-span-2" />
        <Skeleton className="h-[320px] rounded-xl" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-[300px] rounded-xl lg:col-span-2" />
        <Skeleton className="h-[300px] rounded-xl" />
      </div>
    </div>
  )
}

// Figma "Admin – Dashboard" (54:7628).
export default function Dashboard() {
  const { data, isLoading, isError, refetch } = useAdminDashboard()

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h1 className="font-body text-[20px] font-bold text-text">{greeting()}</h1>
          <p className="text-[13px] text-text-muted">Here's what is happening in your store today.</p>
        </div>
        <Button Icon={Plus} to="/admin/products/new">
          Add product
        </Button>
      </div>

      {isLoading ? (
        <DashboardSkeleton />
      ) : isError ? (
        <div className="rounded-xl border border-border bg-white">
          <ErrorState title="Could not load the dashboard" onRetry={refetch} />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
            <StatCard label="Today's orders" value={data.today.orders} Icon={ClipboardList} tone="primary" hint="Not counting cancelled" />
            <StatCard label="Today's sales" value={formatPrice(data.today.sales)} Icon={Wallet} tone="success" hint="Order totals today" />
            <StatCard label="Pending orders" value={data.pendingCount} Icon={Clock} tone="highlight" hint="Call customers to confirm" />
            <StatCard label="Low stock" value={`${data.lowStockCount} ${data.lowStockCount === 1 ? 'product' : 'products'}`} Icon={TriangleAlert} tone="secondary" hint="5 or fewer left" />
          </div>

          <div className="grid gap-4 lg:grid-cols-3 lg:items-start">
            <SalesChart days={data.salesByDay} />

            <Panel title="Top selling">
              {data.topProducts.length === 0 ? (
                <p className="py-6 text-center text-body text-text-muted">No sales yet.</p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {data.topProducts.map((p) => (
                    <li key={p.productId}>
                      <Link to={`/admin/products/${p.productId}/edit`} className="flex items-center gap-3 rounded-lg hover:bg-fill-soft">
                        <Thumb src={p.image} />
                        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                          <span className="truncate text-[13px] font-semibold text-text">{p.name}</span>
                          <span className="text-body-sm text-text-muted">{p.quantity} sold</span>
                        </span>
                        <span className="text-[13px] font-bold whitespace-nowrap text-text">{formatPrice(p.revenue)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>

          <div className="grid gap-4 lg:grid-cols-3 lg:items-start">
            <Panel title="Latest orders" action={<ViewAll to="/admin/orders" />} className="p-0 lg:col-span-2 lg:p-0 [&>div:first-child]:px-4 [&>div:first-child]:pt-4 lg:[&>div:first-child]:px-5 lg:[&>div:first-child]:pt-[18px]">
              {data.latestOrders.length === 0 ? (
                <p className="px-5 pb-6 text-center text-body text-text-muted">No orders yet.</p>
              ) : (
                <ul>
                  {data.latestOrders.map((o) => (
                    <li key={o.orderId} className="border-t border-row-line">
                      <Link
                        to={`/admin/orders/${o.orderId}`}
                        className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 px-4 py-3 hover:bg-fill-soft sm:grid-cols-[110px_minmax(0,1fr)_80px_100px_130px] sm:gap-x-4 lg:px-5"
                      >
                        <span className="text-[13px] font-semibold text-text">#{o.orderId}</span>
                        <span className="truncate text-[13px] text-text-secondary max-sm:order-3">
                          {o.customer?.name}
                          {o.area && ` · ${o.area}`}
                        </span>
                        <span className="text-right text-[13px] font-semibold text-text max-sm:order-2 sm:text-left">{formatPrice(o.total)}</span>
                        <span className="max-sm:order-4 max-sm:justify-self-end">
                          <StatusBadge status={o.status} />
                        </span>
                        <span className="text-body-sm whitespace-nowrap text-text-muted max-sm:order-5 max-sm:col-span-2 sm:text-right">{formatDate(o.createdAt, { withTime: true })}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel title="Low stock" action={data.lowStockCount > 0 && <ViewAll to="/admin/products?stock=low" label="All" />}>
              {data.lowStock.length === 0 ? (
                <p className="py-6 text-center text-body text-text-muted">Every product has more than 5 in stock.</p>
              ) : (
                <ul className="flex flex-col">
                  {data.lowStock.map((p) => (
                    <li key={p.id} className="border-b border-row-line last:border-b-0">
                      <Link to={`/admin/products/${p.id}/edit?focus=stock`} state={{ code: p.code }} className="flex items-center justify-between gap-3 py-2.5 hover:bg-fill-soft">
                        <span className="min-w-0 truncate text-[13px] font-medium text-text">{p.name}</span>
                        <span className={cn('shrink-0 rounded-[10px] px-2 py-[3px] text-[11px] font-bold', p.stock > 0 ? 'bg-highlight-soft text-highlight-ink' : 'bg-error-tint text-error')}>
                          {p.stock > 0 ? `${p.stock} left` : 'Out of stock'}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        </>
      )}
    </div>
  )
}
