import { Copy, Pencil, Plus, Shuffle, Ticket, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import Button from '../../components/admin/Button.jsx'
import ConfirmDialog from '../../components/admin/ConfirmDialog.jsx'
import DataTable from '../../components/admin/DataTable.jsx'
import ErrorState from '../../components/admin/ErrorState.jsx'
import FormField from '../../components/admin/FormField.jsx'
import Modal from '../../components/admin/Modal.jsx'
import PageHeader from '../../components/admin/PageHeader.jsx'
import Toggle from '../../components/admin/Toggle.jsx'
import { inputClass } from '../../components/admin/inputClass.js'
import { useAdminCoupons, useDeleteCoupon, useSaveCoupon } from '../../hooks/useAdminCoupons.js'
import { formatDate, formatPrice, toDhakaInput } from '../../lib/adminFormat.js'
import { copyText } from '../../lib/clipboard.js'
import { cn } from '../../lib/cn.js'
import { notify } from '../../lib/notify.jsx'
import { errorMessage } from '../../lib/query.js'
import { zodResolver } from '../../lib/zodResolver.js'

const iconButton = 'flex size-8 items-center justify-center rounded-lg border border-border-strong text-text-secondary hover:border-text-faint hover:text-text'

const discountText = (c) => (c.type === 'percent' ? `${c.value}% off` : `${formatPrice(c.value)} off`)
const isExpired = (c) => Boolean(c.expiresAt) && new Date(c.expiresAt) < new Date()

const schema = z
  .object({
    code: z
      .string()
      .trim()
      .regex(/^[A-Za-z0-9_-]{3,30}$/, 'Use 3 to 30 letters, digits, - or _'),
    type: z.enum(['fixed', 'percent']),
    value: z
      .string()
      .trim()
      .refine((v) => Number(v) > 0, 'Enter a discount above 0'),
    minOrder: z
      .string()
      .trim()
      .refine((v) => v === '' || Number(v) >= 0, 'Minimum order must be 0 or more'),
    expiresAt: z.string(),
    active: z.boolean(),
    isPublic: z.boolean(),
  })
  .refine((v) => v.type !== 'percent' || Number(v.value) <= 100, { path: ['value'], message: 'A percent discount cannot be above 100' })

const toFormValues = (c) => ({
  code: c?.code ?? '',
  type: c?.type ?? 'fixed',
  value: c ? String(c.value) : '',
  minOrder: c?.minOrder ? String(c.minOrder) : '',
  expiresAt: toDhakaInput(c?.expiresAt).slice(0, 10),
  active: c ? c.active !== false : true,
  isPublic: c ? c.isPublic !== false : true,
})

// The coupon works until the end of the chosen day in Dhaka.
const toPayload = (v) => ({
  code: v.code.trim().toUpperCase(),
  type: v.type,
  value: Number(v.value),
  minOrder: v.minOrder === '' ? 0 : Number(v.minOrder),
  expiresAt: v.expiresAt ? new Date(`${v.expiresAt}T23:59:59+06:00`).toISOString() : null,
  active: v.active,
  isPublic: v.isPublic,
})

const randomCode = () => `TS${Math.random().toString(36).slice(2, 8).toUpperCase()}`

function CouponForm({ coupon, onClose }) {
  const isEdit = Boolean(coupon)
  const initial = useMemo(() => toFormValues(coupon), [coupon])
  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema), defaultValues: initial })
  const type = useWatch({ control, name: 'type' })
  const save = useSaveCoupon()
  const codeField = register('code')

  const onSubmit = (values) => {
    const payload = toPayload(values)
    const before = toPayload(initial)
    const data = isEdit ? Object.fromEntries(Object.entries(payload).filter(([k, v]) => v !== before[k])) : payload
    if (!Object.keys(data).length) return onClose()
    save.mutate(
      { id: coupon?._id, data },
      {
        onSuccess: (c) => {
          notify.success(isEdit ? 'Coupon saved' : 'Coupon created', { description: c.code })
          onClose()
        },
        onError: (error) => notify.error(isEdit ? 'Could not save coupon' : 'Could not create coupon', { description: errorMessage(error) }),
      },
    )
  }

  const typeButton = (value, label) => (
    <button
      type="button"
      role="radio"
      aria-checked={type === value}
      onClick={() => setValue('type', value, { shouldDirty: true, shouldValidate: Boolean(errors.value) })}
      className={cn(
        'flex h-10 flex-1 items-center justify-center rounded-lg border text-[13px] font-semibold transition-colors',
        type === value ? 'border-primary bg-primary-tint text-text' : 'border-border-strong bg-white text-text-secondary hover:text-text',
      )}
    >
      {label}
    </button>
  )

  return (
    <Modal
      open
      onClose={save.isPending ? () => {} : onClose}
      title={isEdit ? `Edit ${coupon.code}` : 'Create coupon'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={save.isPending}>
            Cancel
          </Button>
          <Button type="submit" form="coupon-form" loading={save.isPending}>
            {isEdit ? 'Save coupon' : 'Create coupon'}
          </Button>
        </>
      }
    >
      <form id="coupon-form" onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <FormField label="Coupon code" htmlFor="coupon-code" required error={errors.code?.message} hint="Customers type this at checkout. Saved in capitals.">
          <div className={cn(inputClass(errors.code), 'flex items-center gap-2 pr-1.5 focus-within:border-primary')}>
            <input
              id="coupon-code"
              placeholder="WINTER150"
              autoCapitalize="characters"
              className="h-full min-w-0 flex-1 bg-transparent font-semibold uppercase outline-none placeholder:font-normal placeholder:normal-case"
              {...codeField}
              onChange={(e) => {
                e.target.value = e.target.value.toUpperCase().replace(/\s+/g, '')
                codeField.onChange(e)
              }}
            />
            <button
              type="button"
              onClick={() => setValue('code', randomCode(), { shouldDirty: true, shouldValidate: true })}
              className="flex h-8 shrink-0 items-center gap-1.5 rounded-md bg-fill px-2.5 text-[12px] font-semibold text-text hover:bg-fill-line"
            >
              <Shuffle size={13} />
              Generate
            </button>
          </div>
        </FormField>

        <div role="radiogroup" aria-label="Discount type" className="flex gap-2.5">
          {typeButton('fixed', 'Fixed ৳')}
          {typeButton('percent', 'Percent %')}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label={type === 'percent' ? 'Discount (%)' : 'Discount (৳)'} htmlFor="coupon-value" required error={errors.value?.message}>
            <input id="coupon-value" type="number" inputMode="decimal" min="0" max={type === 'percent' ? 100 : undefined} placeholder={type === 'percent' ? '10' : '150'} aria-invalid={Boolean(errors.value)} className={inputClass(errors.value)} {...register('value')} />
          </FormField>
          <FormField label="Minimum order (৳)" htmlFor="coupon-min" error={errors.minOrder?.message} hint="Empty: any order amount.">
            <input id="coupon-min" type="number" inputMode="numeric" min="0" placeholder="1500" aria-invalid={Boolean(errors.minOrder)} className={inputClass(errors.minOrder)} {...register('minOrder')} />
          </FormField>
        </div>

        <FormField label="Valid until" htmlFor="coupon-expiry" hint="Works until the end of this day. Empty: never expires.">
          <input id="coupon-expiry" type="date" className={inputClass()} {...register('expiresAt')} />
        </FormField>

        <div className="flex flex-col gap-3 rounded-lg bg-fill-soft p-3.5">
          <Controller control={control} name="active" render={({ field }) => <Toggle checked={field.value} onChange={field.onChange} label="Active, customers can use it" />} />
          <Controller control={control} name="isPublic" render={({ field }) => <Toggle checked={field.value} onChange={field.onChange} label="Public, listed on the Offers page" />} />
        </div>
      </form>
    </Modal>
  )
}

// Figma "Admin – Coupons" (62:9961).
export default function Coupons() {
  const { data: coupons = [], isLoading, isError, refetch } = useAdminCoupons()
  const save = useSaveCoupon()
  const remove = useDeleteCoupon()
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [toggling, setToggling] = useState(null)

  const toggle = (coupon, key) => {
    const value = coupon[key] === false
    setToggling(`${coupon._id}-${key}`)
    save.mutate(
      { id: coupon._id, data: { [key]: value } },
      {
        onSuccess: (c) => notify.success(key === 'active' ? (value ? 'Coupon turned on' : 'Coupon turned off') : value ? 'Coupon is now public' : 'Coupon is now hidden', { description: c.code }),
        onError: (error) => notify.error('Could not update coupon', { description: errorMessage(error) }),
        onSettled: () => setToggling(null),
      },
    )
  }

  const confirmDelete = () =>
    remove.mutate(deleting._id, {
      onSuccess: () => {
        notify.success('Coupon deleted', { description: deleting.code })
        setDeleting(null)
      },
      onError: (error) => notify.error('Could not delete coupon', { description: errorMessage(error) }),
    })

  const flag = (key, label) => (c) => <Toggle checked={c[key] !== false} disabled={toggling === `${c._id}-${key}`} onChange={() => toggle(c, key)} ariaLabel={`${label} ${c.code}`} />

  const columns = [
    {
      key: 'code',
      header: 'Code',
      render: (c) => (
        <div className="flex items-center gap-1.5">
          <span className="rounded-md border border-dashed border-check-line bg-fill px-2 py-1 text-[13px] font-bold whitespace-nowrap text-text">{c.code}</span>
          <button type="button" onClick={() => copyText(c.code, 'Coupon code copied')} aria-label={`Copy ${c.code}`} className="flex size-7 items-center justify-center rounded-md text-text-faint hover:text-text">
            <Copy size={14} />
          </button>
        </div>
      ),
    },
    { key: 'discount', header: 'Discount', render: (c) => <span className="font-bold whitespace-nowrap text-text">{discountText(c)}</span> },
    { key: 'minOrder', header: 'Min order', render: (c) => <span className="whitespace-nowrap">{c.minOrder ? formatPrice(c.minOrder) : 'Any'}</span> },
    {
      key: 'expiresAt',
      header: 'Valid until',
      render: (c) =>
        !c.expiresAt ? <span className="text-text-muted">No expiry</span> : <span className={cn('whitespace-nowrap', isExpired(c) && 'font-semibold text-error')}>{isExpired(c) ? `Ended ${formatDate(c.expiresAt)}` : formatDate(c.expiresAt)}</span>,
    },
    { key: 'used', header: 'Used', align: 'center', render: (c) => c.usedCount ?? 0 },
    { key: 'isPublic', header: 'Public', render: flag('isPublic', 'List publicly') },
    { key: 'active', header: 'Active', render: flag('active', 'Turn on') },
    {
      key: 'actions',
      header: <span className="sr-only">Actions</span>,
      align: 'right',
      render: (c) => (
        <div className="flex justify-end gap-1.5">
          <button type="button" onClick={() => setEditing({ coupon: c })} aria-label={`Edit ${c.code}`} className={iconButton}>
            <Pencil size={15} />
          </button>
          <button type="button" onClick={() => setDeleting(c)} aria-label={`Delete ${c.code}`} className={cn(iconButton, 'text-error hover:border-error hover:text-error')}>
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Coupons" subtitle="Customers enter these codes at checkout." action={{ label: 'Create coupon', Icon: Plus, onClick: () => setEditing({ coupon: null }) }} />

      {isError ? (
        <div className="rounded-xl border border-border bg-white">
          <ErrorState title="Could not load coupons" onRetry={refetch} />
        </div>
      ) : (
        <DataTable
          columns={columns}
          rows={coupons}
          rowKey="_id"
          loading={isLoading}
          empty={{ Icon: Ticket, title: 'No coupons yet', text: 'Create a code to give customers a discount at checkout.', action: { label: 'Create coupon', Icon: Plus, onClick: () => setEditing({ coupon: null }) } }}
        />
      )}

      {editing && <CouponForm key={editing.coupon?._id ?? 'new'} coupon={editing.coupon} onClose={() => setEditing(null)} />}

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        loading={remove.isPending}
        danger
        title="Delete coupon?"
        message={deleting && `${deleting.code} will stop working at checkout right away. This cannot be undone.`}
        confirmLabel="Delete"
      />
    </div>
  )
}
