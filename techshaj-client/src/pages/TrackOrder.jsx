import { PackageSearch, Search } from 'lucide-react'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useSearchParams } from 'react-router-dom'
import { z } from 'zod'
import Breadcrumbs from '../components/Breadcrumbs.jsx'
import ErrorState from '../components/ErrorState.jsx'
import TrackingResult from '../components/order/TrackingResult.jsx'
import { useSettings } from '../hooks/useSettings.js'
import { useTrackOrder } from '../hooks/useTrackOrder.js'
import { cn } from '../lib/cn.js'
import { toLatinDigits } from '../lib/format.js'
import { normalizeOrder } from '../lib/order.js'
import { zodResolver } from '../lib/zodResolver.js'
import { usePageTitle } from '../hooks/usePageTitle.js'

const schema = z.object({
  id: z.string().trim().toUpperCase(),
  phone: z.preprocess(
    (v) => toLatinDigits(String(v ?? '')).replace(/\D/g, '').replace(/^880/, '0'),
    z.string().regex(/^01[3-9]\d{8}$/, 'Enter the 11-digit phone number you used at checkout'),
  ),
})

const input =
  'h-12 w-full rounded-[10px] border border-nav-line bg-surface px-3.5 text-body text-text outline-none placeholder:text-text-faint focus:border-primary lg:flex-1'

// Figma "Track Order" desktop (34:3456) and mobile (34:3811).
export default function TrackOrder() {
  usePageTitle('Track Order')
  const [params, setParams] = useSearchParams()
  const { data: store } = useSettings()
  // The query lives in the URL, so links from Order Success arrive already searched.
  const parsed = schema.safeParse({ id: params.get('id') ?? '', phone: params.get('phone') ?? '' })
  const query = parsed.success ? parsed.data : null
  const tracked = useTrackOrder(query)
  const zones = store?.shippingZones
  const search = params.toString()
  const result = useMemo(
    () => (query && tracked.data ? { query, orders: tracked.data.map((o) => normalizeOrder(o, zones)) } : null),
    [search, tracked.data, zones], // eslint-disable-line react-hooks/exhaustive-deps
  )

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { id: params.get('id') ?? '', phone: params.get('phone') ?? '' } })

  const onSubmit = (query) => setParams(query.id ? { id: query.id, phone: query.phone } : { phone: query.phone }, { replace: true })

  return (
    <div className="pb-24 lg:pb-[72px]">
      <div className="hidden bg-surface lg:block">
        <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Order Tracking' }]} className="site-container h-12" />
      </div>

      <div className="mx-auto flex max-w-[852px] flex-col items-start gap-3.5 px-4 pt-5 lg:items-center lg:gap-[22px] lg:pt-12">
        <h1 className="text-[22px] font-bold tracking-[-0.33px] text-text lg:text-[30px] lg:tracking-[-0.45px]">Order Tracking</h1>
        <p className="text-[13px] text-text-muted lg:text-body">
          <span className="lg:hidden">Enter your order ID and phone number.</span>
          <span className="hidden lg:inline">Enter your order ID and the phone number you used at checkout.</span>
        </p>

        <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex w-full flex-col gap-2.5">
          <div className="flex w-full flex-col gap-2.5 lg:flex-row">
            <input {...register('id')} placeholder="Order ID (e.g. TS2610305)" aria-label="Order ID" autoComplete="off" className={cn(input, 'uppercase placeholder:normal-case')} />
            <input
              {...register('phone')}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="Phone number (11 digits)"
              aria-label="Phone number"
              aria-invalid={Boolean(errors.phone)}
              className={cn(input, errors.phone && 'border-error bg-error-wash')}
            />
            <button type="submit" className="flex h-12 shrink-0 items-center justify-center gap-2 rounded-[10px] bg-highlight px-7 text-[15px] font-bold text-text">
              <Search size={17} />
              Track
            </button>
          </div>
          {errors.phone ? (
            <p role="alert" className="text-body-sm font-medium text-error">
              {errors.phone.message}
            </p>
          ) : (
            <p className="text-body-sm text-text-faint">No order ID? Search with your phone number only to see all your orders.</p>
          )}
        </form>

        {query && tracked.isError && !tracked.data && (
          <ErrorState title="Could not find your order right now" onRetry={tracked.refetch} />
        )}
        {result && (
          <div className="flex w-full flex-col gap-3.5 pt-1 lg:gap-5">
            {result.orders.length === 0 ? (
              <div className="flex w-full flex-col items-center gap-2 rounded-2xl border border-border bg-white px-4 py-10 text-center">
                <PackageSearch size={36} className="text-text-faint" />
                <p className="text-body-lg font-bold text-text">No order found</p>
                <p className="text-body text-text-muted">
                  {result.query.id ? 'Check the order ID and phone number and try again.' : 'We could not find any orders for this phone number.'}
                </p>
              </div>
            ) : (
              <>
                {!result.query.id && (
                  <p className="text-body text-text-muted">
                    {result.orders.length} {result.orders.length === 1 ? 'order' : 'orders'} for {result.query.phone}
                  </p>
                )}
                {result.orders.map((order) => (
                  <TrackingResult key={order.id} order={order} zones={zones ?? []} />
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
