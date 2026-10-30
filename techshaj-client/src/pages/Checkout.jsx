import { ShieldCheck, TriangleAlert, Truck, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import EmptyCart from '../components/cart/EmptyCart.jsx'
import QtyStepper from '../components/cart/QtyStepper.jsx'
import CouponBox from '../components/checkout/CouponBox.jsx'
import ErrorState from '../components/ErrorState.jsx'
import Field from '../components/checkout/Field.jsx'
import RadioCard from '../components/checkout/RadioCard.jsx'
import PageTopBar from '../components/PageTopBar.jsx'
import { useCartStore } from '../context/useCartStore.js'
import { useOrderStore } from '../context/useOrderStore.js'
import { useCart } from '../hooks/useCart.js'
import { usePlaceOrder, useValidateCoupon } from '../hooks/useCheckout.js'
import { useIsDesktop } from '../hooks/useMediaQuery.js'
import { variantLabel } from '../lib/cart.js'
import { cn } from '../lib/cn.js'
import { formatPrice, toBanglaDigits, toLatinDigits } from '../lib/format.js'
import { notify } from '../lib/notify.jsx'
import { errorMessage } from '../lib/query.js'
import { zodResolver } from '../lib/zodResolver.js'
import { usePageTitle } from '../hooks/usePageTitle.js'

const PAYMENTS = [
  { id: 'cod', label: 'COD' },
  { id: 'bkash', label: 'bKash' },
  { id: 'nagad', label: 'Nagad' },
]

// Accepts Bangla digits, spaces, dashes and a +88 prefix, then expects 01XXXXXXXXX.
const normalizePhone = (v) => toLatinDigits(v).replace(/\D/g, '').replace(/^880/, '0')

const schema = z
  .object({
    phone: z.preprocess((v) => normalizePhone(String(v ?? '')), z.string().regex(/^01[3-9]\d{8}$/, 'সঠিক ১১ সংখ্যার মোবাইল নাম্বার দিন')),
    name: z.string().trim().min(2, 'আপনার নাম লিখুন'),
    address: z.string().trim().min(10, 'ডেলিভারির জন্য পুরো ঠিকানা দরকার'),
    note: z.string().optional(),
    zone: z.string(),
    payment: z.enum(['cod', 'bkash', 'nagad']),
    trxId: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.payment !== 'cod' && (data.trxId ?? '').trim().length < 6) {
      ctx.addIssue({ code: 'custom', path: ['trxId'], message: 'সঠিক ট্রানজেকশন আইডি দিন' })
    }
  })

function OrderItems({ lines }) {
  const updateQty = useCartStore((s) => s.updateQty)
  return (
    <ul className="flex w-full flex-col gap-3.5">
      {lines.map(({ key, product, qty, variant }) => (
        <li key={key} className="flex items-center gap-3 lg:border-b lg:border-border lg:pb-3.5">
          <span className="size-[52px] shrink-0 overflow-hidden rounded-lg bg-fill lg:size-14">
            <img src={product.images[0]} alt="" loading="lazy" decoding="async" className="size-full object-contain mix-blend-multiply" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-[3px] lg:gap-1">
            <span className="truncate text-[13px] font-semibold text-text lg:text-label">{product.name}</span>
            <span className="text-body-sm whitespace-pre text-text-muted">
              {[variantLabel(variant), formatPrice(product.price)].filter(Boolean).join('  •  ')}
            </span>
          </span>
          <QtyStepper value={qty} max={product.stock} onChange={(n) => updateQty(key, n)} />
        </li>
      ))}
    </ul>
  )
}

function Bill({ subtotal, shipping, discount, total }) {
  const row = 'flex justify-between text-[13px] lg:text-body'
  return (
    <div className="flex w-full flex-col gap-3 bg-white p-4 lg:gap-2.5 lg:rounded-[10px] lg:bg-fill-soft lg:p-3.5">
      <p className={row}>
        <span className="font-bangla text-text-muted">সাবটোটাল</span>
        <span className="font-semibold text-text">{formatPrice(subtotal)}</span>
      </p>
      <p className={row}>
        <span className="font-bangla text-text-muted">ডেলিভারি চার্জ</span>
        {shipping === 0 ? <span className="font-bangla font-bold text-success">ফ্রি</span> : <span className="font-semibold text-text">{formatPrice(shipping)}</span>}
      </p>
      {discount > 0 && (
        <p className={row}>
          <span className="font-bangla text-text-muted">কুপন ডিসকাউন্ট</span>
          <span className="font-semibold text-stock-ink">−{formatPrice(discount)}</span>
        </p>
      )}
      <hr className="hidden border-nav-line lg:block" />
      <p className="flex items-center justify-between text-text">
        <span className="font-bangla text-[15px] font-bold lg:text-body-lg">মোট</span>
        <span className="text-[20px] font-extrabold lg:text-[22px]">{formatPrice(total)}</span>
      </p>
    </div>
  )
}

function PlaceOrder({ total, submitting, className }) {
  return (
    <div className={cn('flex w-full flex-col gap-2 lg:gap-3.5', className)}>
      <button
        type="submit"
        disabled={submitting}
        className="bg-brand-gradient h-[50px] w-full rounded-[10px] font-bangla text-body-lg font-semibold whitespace-pre text-white disabled:opacity-60 lg:h-[52px] lg:text-[17px]"
      >
        {`অর্ডার কনফার্ম করুন  •  ${formatPrice(total)}`}
      </button>
      <p className="flex items-center justify-center gap-1.5 font-bangla text-[11px] text-text-muted lg:text-body-sm">
        <ShieldCheck className="size-3.5 shrink-0 text-success lg:size-[15px]" />
        <span className="lg:hidden">প্রতিনিধি কল করে অর্ডার কনফার্ম করবেন</span>
        <span className="hidden lg:inline">অর্ডারের পর আমাদের প্রতিনিধি কল করে কনফার্ম করবেন</span>
      </p>
    </div>
  )
}

function CheckoutForm({ cart }) {
  const navigate = useNavigate()
  const isDesktop = useIsDesktop()
  const clearCart = useCartStore((s) => s.clear)
  const setLastOrder = useOrderStore((s) => s.setLastOrder)
  // { code, discount, subtotal } as the server last confirmed it.
  const [applied, setApplied] = useState(null)
  const [couponError, setCouponError] = useState(null)
  const validateCoupon = useValidateCoupon()
  const placeOrder = usePlaceOrder()
  const { store, lines, subtotal, freeShipping, allFreeDelivery } = cart
  const zones = store.shippingZones

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, submitCount },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { phone: '', name: '', address: '', note: '', zone: zones[0].id, payment: 'cod', trxId: '' },
  })

  const [zoneId, payment] = useWatch({ control, name: ['zone', 'payment'] })
  const zone = zones.find((z) => z.id === zoneId) ?? zones[0]
  const wallet = store.mobilePayments?.find((m) => m.id === payment)
  // Shown as a preview only; the server works out the real totals when the order is placed.
  const shipping = freeShipping ? 0 : zone.charge
  const discount = applied && !couponError ? applied.discount : 0
  const total = subtotal + shipping - discount
  const errorCount = Object.keys(errors).length

  const checkCoupon = (code, { silent } = {}) =>
    validateCoupon.mutate(
      { code, subtotal },
      {
        onSuccess: (result) => {
          setApplied(result.valid ? { code, discount: result.discount, subtotal } : null)
          setCouponError(result.valid ? null : result.message)
          if (result.valid && !silent) notify.info('Coupon applied', { description: `${code} · You saved ${formatPrice(result.discount)}` })
        },
        onError: (error) => setCouponError(errorMessage(error, 'Could not check this coupon. Try again.')),
      },
    )

  // Re-checked when the cart changes so removing items can invalidate a coupon.
  useEffect(() => {
    if (applied && applied.subtotal !== subtotal && !validateCoupon.isPending) checkCoupon(applied.code, { silent: true })
  }, [subtotal]) // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = (form) => {
    const order = {
      customer: { name: form.name.trim(), phone: form.phone, address: form.address.trim(), note: form.note?.trim() ?? '' },
      zoneId: zone.id,
      paymentMethod: form.payment,
      transactionId: form.payment === 'cod' ? '' : form.trxId.trim(),
      couponCode: applied?.code ?? '',
      items: lines.map((l) => ({ productId: l.productId, variant: l.variant, quantity: l.qty })),
    }
    placeOrder.mutate(order, {
      onSuccess: ({ orderId, total }) => {
        setLastOrder({
          orderId,
          total,
          phone: order.customer.phone,
          address: order.customer.address,
          paymentMethod: order.paymentMethod,
          items: lines.map((l) => ({ name: l.product.name, qty: l.qty })),
        })
        navigate('/order-success', { replace: true })
        clearCart()
      },
      onError: (error) => notify.error('Order failed', { description: errorMessage(error, 'Could not place your order. Please try again.') }),
    })
  }

  const close = () => (window.history.state?.idx > 0 ? navigate(-1) : navigate('/'))
  const section = 'flex w-full flex-col gap-3 bg-white p-4 lg:contents'
  const heading = 'font-bangla text-[15px] font-bold text-text'

  const banner = submitCount > 0 && errorCount > 0 && (
    <p role="alert" className="flex items-center gap-2 rounded-[10px] border border-error-line bg-error-tint px-3 py-2.5 font-bangla text-[13px] font-semibold text-error">
      <TriangleAlert size={16} className="shrink-0" />
      {toBanglaDigits(errorCount)}টি তথ্য ঠিক করে আবার চেষ্টা করুন
    </p>
  )

  const customer = (
    <div className={section}>
      <h2 className={cn(heading, 'lg:hidden')}>আপনার তথ্য</h2>
      {banner}
      <Field
        label="মোবাইল নাম্বার *"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder={isDesktop ? '১১ ডিজিটের মোবাইল নাম্বার (01XXXXXXXXX)' : '01XXXXXXXXX'}
        error={errors.phone?.message}
        {...register('phone')}
      />
      <Field label="আপনার নাম *" autoComplete="name" placeholder="পুরো নাম লিখুন" error={errors.name?.message} {...register('name')} />
      <Field
        label="সম্পূর্ণ ঠিকানা *"
        multiline
        autoComplete="street-address"
        placeholder="বাসা, রোড, এলাকা, থানা, জেলা"
        error={errors.address?.message}
        {...register('address')}
      />
      <Field label="অর্ডার নোট" placeholder={isDesktop ? 'বিশেষ কিছু বলার থাকলে লিখুন (ঐচ্ছিক)' : 'ঐচ্ছিক'} {...register('note')} />
    </div>
  )

  const delivery = (
    <div className={section}>
      <h2 id="zone-label" className={cn(heading, 'lg:text-label lg:font-semibold')}>
        ডেলিভারি এলাকা<span className="hidden lg:inline"> *</span>
      </h2>
      <div role="radiogroup" aria-labelledby="zone-label" className="flex flex-wrap gap-2 lg:gap-2.5">
        {zones.map((z) => (
          <RadioCard key={z.id} value={z.id} checked={zone.id === z.id} {...register('zone')} className="h-[54px] flex-1 basis-[130px] px-3 lg:h-[58px] lg:gap-2.5">
            <span className="flex flex-col font-bangla leading-normal whitespace-nowrap">
              <span className="text-[13px] font-semibold text-text lg:text-label">{z.nameBn || z.name}</span>
              {freeShipping ? (
                <span className="text-body-sm font-bold text-success lg:text-[13px]">ফ্রি</span>
              ) : (
                <span className="font-body text-body-sm font-semibold text-text-muted lg:text-[13px]">{formatPrice(z.charge)}</span>
              )}
            </span>
          </RadioCard>
        ))}
      </div>
      {freeShipping && (
        <p className="flex items-center gap-2 rounded-lg bg-success-tint px-3 py-2 font-bangla text-[13px] font-semibold text-success">
          <Truck size={15} className="shrink-0" />
          {allFreeDelivery ? 'এই পণ্যে ডেলিভারি চার্জ সম্পূর্ণ ফ্রি' : 'আপনার অর্ডারে ডেলিভারি চার্জ সম্পূর্ণ ফ্রি'}
        </p>
      )}
    </div>
  )

  const coupon = (
    <CouponBox
      applied={applied?.code ?? null}
      error={couponError}
      discount={discount}
      onApply={(code) => checkCoupon(code)}
      onRemove={() => {
        setApplied(null)
        setCouponError(null)
      }}
    />
  )

  const paymentSection = (
    <div className={section}>
      <h2 id="payment-label" className={heading}>
        পেমেন্ট মেথড
      </h2>
      <div role="radiogroup" aria-labelledby="payment-label" className="flex gap-2">
        {PAYMENTS.map((p) => (
          <RadioCard key={p.id} value={p.id} checked={payment === p.id} {...register('payment')} className="h-11 flex-1 lg:h-[46px]">
            <span className="text-[13px] font-semibold text-text">{p.label}</span>
          </RadioCard>
        ))}
      </div>
      {wallet && (
        <div className="flex flex-col gap-3 rounded-[10px] border border-highlight-line bg-highlight-tint p-3">
          <p className="font-bangla text-[13px] leading-5 text-text-secondary">
            নিচের {wallet.name} ({wallet.type}) নাম্বারে <b className="font-body font-bold text-text">{formatPrice(total)}</b> সেন্ড মানি করে ট্রানজেকশন আইডি দিন।
            <span className="mt-1 block font-body text-[17px] font-bold tracking-[0.5px] text-text">{wallet.number}</span>
          </p>
          <Field label="ট্রানজেকশন আইডি *" autoComplete="off" placeholder="যেমন: 8N7A6B5C4D" error={errors.trxId?.message} {...register('trxId')} />
        </div>
      )}
      {!isDesktop && coupon}
    </div>
  )

  return (
    <form
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      className="bg-surface pb-[calc(110px+env(safe-area-inset-bottom))] lg:fixed lg:inset-0 lg:z-50 lg:flex lg:overflow-y-auto lg:bg-dark/55 lg:p-6"
    >
      <button type="button" aria-label="Close checkout" onClick={close} className="fixed inset-0 hidden cursor-default lg:block" />
      <div role="dialog" aria-modal={isDesktop} aria-labelledby="checkout-title" className="relative lg:m-auto lg:w-[920px] lg:overflow-hidden lg:rounded-2xl lg:bg-white">
        <PageTopBar>
          <h1 className="font-bangla text-[17px] font-bold text-text">অর্ডার করুন – ক্যাশ অন ডেলিভারি</h1>
        </PageTopBar>
        <div className="hidden items-center justify-between border-b border-border px-6 py-[18px] lg:flex">
          <h1 id="checkout-title" className="font-bangla text-[20px] font-bold text-text">
            অর্ডার করুন – ক্যাশ অন ডেলিভারি
          </h1>
          <button type="button" onClick={close} aria-label="Close checkout" className="flex size-9 items-center justify-center rounded-full bg-fill text-text">
            <X size={18} />
          </button>
        </div>

        {isDesktop ? (
          <div className="flex items-start gap-6 px-6 pt-5 pb-6">
            <div className="flex min-w-0 flex-1 flex-col gap-3.5">
              {customer}
              {delivery}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-3.5">
              <OrderItems lines={lines} />
              {coupon}
              <Bill subtotal={subtotal} shipping={shipping} discount={discount} total={total} />
              {paymentSection}
              <PlaceOrder total={total} submitting={placeOrder.isPending} />
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5 pt-2.5">
            <div className="bg-white p-4">
              <OrderItems lines={lines} />
            </div>
            {customer}
            {delivery}
            {paymentSection}
            <Bill subtotal={subtotal} shipping={shipping} discount={discount} total={total} />
            <PlaceOrder
              total={total}
              submitting={placeOrder.isPending}
              className="fixed inset-x-0 bottom-0 z-30 border-t border-nav-line bg-white px-4 pt-2.5 pb-[calc(14px+env(safe-area-inset-bottom))]"
            />
          </div>
        )}
      </div>
    </form>
  )
}

// Figma checkout: desktop modal (31:3530), mobile page (33:3561), error state (86:15837).
export default function Checkout() {
  usePageTitle('Checkout')
  const cart = useCart()

  if (!cart.ready && cart.isError) return <ErrorState onRetry={cart.refetch} />
  if (!cart.ready) return <div className="min-h-[60vh]" />
  if (cart.lines.length === 0) {
    return (
      <div className="pt-10 lg:py-16">
        <EmptyCart />
      </div>
    )
  }
  return <CheckoutForm cart={cart} />
}
