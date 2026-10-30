import { Calendar, Image, ImageOff, Link2, Pencil, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useSearchParams } from 'react-router-dom'
import { z } from 'zod'
import { Skeleton } from '../../components/Skeleton.jsx'
import Button from '../../components/admin/Button.jsx'
import ConfirmDialog from '../../components/admin/ConfirmDialog.jsx'
import EmptyState from '../../components/admin/EmptyState.jsx'
import ErrorState from '../../components/admin/ErrorState.jsx'
import FormField from '../../components/admin/FormField.jsx'
import ImageUploader from '../../components/admin/ImageUploader.jsx'
import Modal from '../../components/admin/Modal.jsx'
import PageHeader from '../../components/admin/PageHeader.jsx'
import Select from '../../components/admin/Select.jsx'
import Tabs from '../../components/admin/Tabs.jsx'
import Toggle from '../../components/admin/Toggle.jsx'
import { inputClass } from '../../components/admin/inputClass.js'
import { useAdminBanners, useDeleteBanner, useSaveBanner } from '../../hooks/useAdminBanners.js'
import { formatDate, fromDhakaInput, toDhakaInput } from '../../lib/adminFormat.js'
import { cn } from '../../lib/cn.js'
import { notify } from '../../lib/notify.jsx'
import { errorMessage } from '../../lib/query.js'
import { zodResolver } from '../../lib/zodResolver.js'

const TYPES = [
  { value: 'hero', label: 'Hero slider', hint: 'Big slides at the top of the homepage. 1200 × 500 px.' },
  { value: 'side', label: 'Side banners', hint: 'Small banners next to the hero slider. 600 × 400 px.' },
  { value: 'promo', label: 'Promo banners', hint: 'Wide banners between homepage sections.' },
  { value: 'menu', label: 'Menu banner', hint: 'The banner inside the category menu. Only the first live one shows.' },
]
const TYPE_VALUES = TYPES.map((t) => t.value)

const iconButton = 'flex size-8 items-center justify-center rounded-lg border border-border-strong text-text-secondary hover:border-text-faint hover:text-text'

// Live, Scheduled or Expired from startAt and endAt.
function scheduleOf(banner, now = Date.now()) {
  if (banner.startAt && new Date(banner.startAt).getTime() > now) return 'scheduled'
  if (banner.endAt && new Date(banner.endAt).getTime() <= now) return 'expired'
  return 'live'
}

const SCHEDULE = {
  live: { label: 'Live', className: 'bg-success-tint text-success' },
  scheduled: { label: 'Scheduled', className: 'bg-info-tint text-info' },
  expired: { label: 'Expired', className: 'bg-error-tint text-error' },
}

function ScheduleBadge({ banner }) {
  const s = SCHEDULE[scheduleOf(banner)]
  return <span className={cn('inline-flex rounded-[10px] px-2 py-[3px] text-label-sm whitespace-nowrap', s.className)}>{s.label}</span>
}

function scheduleText({ startAt, endAt }) {
  if (!startAt && !endAt) return 'Always'
  if (!endAt) return `From ${formatDate(startAt, { withTime: true })}`
  if (!startAt) return `Until ${formatDate(endAt, { withTime: true })}`
  return `${formatDate(startAt, { withTime: true })} – ${formatDate(endAt, { withTime: true })}`
}

function Preview({ src, className }) {
  const [failed, setFailed] = useState(false)
  return (
    <span className={cn('flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-fill text-text-faint', className)}>
      {src && !failed ? <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} className="size-full object-cover" /> : <ImageOff size={20} />}
    </span>
  )
}

const schema = z
  .object({
    type: z.enum(TYPE_VALUES),
    image: z.array(z.string()).min(1, 'Upload the banner image'),
    title: z.string().trim().max(120, 'Keep the title under 120 characters'),
    link: z
      .string()
      .trim()
      .refine((v) => !v || v.startsWith('/') || /^https:\/\/\S+$/.test(v), 'Use a page path like /shop or a full https:// link'),
    active: z.boolean(),
    startAt: z.string(),
    endAt: z.string(),
    order: z.string().trim().regex(/^-?\d+$/, 'Order must be a whole number'),
  })
  // Both are "YYYY-MM-DDTHH:mm", so text order is time order.
  .refine((v) => !v.startAt || !v.endAt || v.endAt > v.startAt, { path: ['endAt'], message: 'End must be after the start' })

const toFormValues = (b, type) => ({
  type: b?.type ?? type,
  image: b?.image ? [b.image] : [],
  title: b?.title ?? '',
  link: b?.link ?? '',
  active: b ? b.active !== false : true,
  startAt: toDhakaInput(b?.startAt),
  endAt: toDhakaInput(b?.endAt),
  order: String(b?.order ?? 0),
})

const toPayload = (v) => ({
  type: v.type,
  image: v.image[0] ?? '',
  title: v.title.trim(),
  link: v.link.trim(),
  active: v.active,
  startAt: fromDhakaInput(v.startAt),
  endAt: fromDhakaInput(v.endAt),
  order: Number(v.order),
})

function BannerForm({ banner, type, nextOrder, onClose }) {
  const isEdit = Boolean(banner)
  const initial = useMemo(() => ({ ...toFormValues(banner, type), ...(!banner && { order: String(nextOrder) }) }), [banner, type, nextOrder])
  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema), defaultValues: initial })
  const save = useSaveBanner()

  const onSubmit = (values) => {
    const payload = toPayload(values)
    const before = toPayload(initial)
    const data = isEdit ? Object.fromEntries(Object.entries(payload).filter(([k, v]) => v !== before[k])) : payload
    if (!Object.keys(data).length) return onClose()
    save.mutate(
      { id: banner?._id, data },
      {
        onSuccess: () => {
          notify.success(isEdit ? 'Banner saved' : 'Banner added')
          onClose()
        },
        onError: (error) => notify.error(isEdit ? 'Could not save banner' : 'Could not add banner', { description: errorMessage(error) }),
      },
    )
  }

  return (
    <Modal
      open
      onClose={save.isPending ? () => {} : onClose}
      title={isEdit ? 'Edit banner' : 'Add banner'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={save.isPending}>
            Cancel
          </Button>
          <Button type="submit" form="banner-form" loading={save.isPending}>
            Save banner
          </Button>
        </>
      }
    >
      <form id="banner-form" onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Type" htmlFor="banner-type" required>
            <Select id="banner-type" className="[&_select]:h-12 [&_select]:rounded-[10px] [&_select]:text-body" {...register('type')}>
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Order" htmlFor="banner-order" error={errors.order?.message} hint="Lower numbers show first.">
            <input id="banner-order" type="number" inputMode="numeric" step="1" aria-invalid={Boolean(errors.order)} className={inputClass(errors.order)} {...register('order')} />
          </FormField>
        </div>

        <FormField label="Image" required error={errors.image?.message}>
          <Controller
            control={control}
            name="image"
            render={({ field }) => <ImageUploader value={field.value} max={1} multiple={false} onChange={(urls) => setValue('image', urls.slice(-1), { shouldDirty: true, shouldValidate: true })} />}
          />
        </FormField>

        <FormField label="Title" htmlFor="banner-title" error={errors.title?.message} hint="Press Enter for a second line on the hero slider.">
          <textarea id="banner-title" rows={2} placeholder="e.g. Power Banks up to 25% OFF" className={cn(inputClass(errors.title), 'h-auto resize-none py-3')} {...register('title')} />
        </FormField>

        <FormField label="Link" htmlFor="banner-link" error={errors.link?.message} hint="Where the banner opens, e.g. /category/power-bank or /offers.">
          <input id="banner-link" placeholder="/shop" className={inputClass(errors.link)} {...register('link')} />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Show from" htmlFor="banner-start" hint="Empty: show right away. Dhaka time.">
            <input id="banner-start" type="datetime-local" className={inputClass()} {...register('startAt')} />
          </FormField>
          <FormField label="Show until" htmlFor="banner-end" error={errors.endAt?.message} hint="Empty: no end date.">
            <input id="banner-end" type="datetime-local" aria-invalid={Boolean(errors.endAt)} className={inputClass(errors.endAt)} {...register('endAt')} />
          </FormField>
        </div>

        <Controller control={control} name="active" render={({ field }) => <Toggle checked={field.value} onChange={field.onChange} label="Active (shown on the store)" />} />
      </form>
    </Modal>
  )
}

function BannerRow({ banner, onEdit, onDelete }) {
  const save = useSaveBanner()
  const title = banner.title?.replace(/\s*\n\s*/g, ' ') || 'Untitled banner'

  const toggle = () =>
    save.mutate(
      { id: banner._id, data: { active: banner.active === false } },
      {
        onSuccess: (b) => notify.success(b.active ? 'Banner turned on' : 'Banner turned off', { description: title }),
        onError: (error) => notify.error('Could not update banner', { description: errorMessage(error) }),
      },
    )

  return (
    <li className="flex flex-wrap items-center gap-3.5 rounded-xl border border-border bg-white p-3 sm:flex-nowrap sm:pr-4">
      <Preview src={banner.image} className="h-[72px] w-[120px] sm:h-[100px] sm:w-[200px]" />
      <div className="flex min-w-0 flex-1 flex-col gap-[5px]">
        <div className="flex min-w-0 items-center gap-2">
          <span className="shrink-0 text-[11px] font-bold text-text-faint">#{banner.order ?? 0}</span>
          <span className="truncate text-[14px] font-bold text-text">{title}</span>
        </div>
        <span className="flex min-w-0 items-center gap-1.5 text-[12px] text-text-secondary">
          <Link2 size={13} className="shrink-0 text-text-muted" />
          <span className="truncate">{banner.link || 'No link'}</span>
        </span>
        <span className="flex flex-wrap items-center gap-1.5 text-[12px] text-text-secondary">
          <Calendar size={13} className="shrink-0 text-text-muted" />
          {scheduleText(banner)}
          <ScheduleBadge banner={banner} />
        </span>
      </div>
      <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
        <Toggle checked={banner.active !== false} onChange={toggle} disabled={save.isPending} ariaLabel={`Show ${title}`} className="mr-auto sm:mr-1" />
        <button type="button" onClick={onEdit} aria-label={`Edit ${title}`} className={iconButton}>
          <Pencil size={15} />
        </button>
        <button type="button" onClick={onDelete} aria-label={`Delete ${title}`} className={cn(iconButton, 'text-error hover:border-error hover:text-error')}>
          <Trash2 size={15} />
        </button>
      </div>
    </li>
  )
}

// Figma "Admin – Banners" (61:9196).
export default function Banners() {
  const [params, setParams] = useSearchParams()
  const type = TYPE_VALUES.includes(params.get('type')) ? params.get('type') : 'hero'
  const { data: banners = [], isLoading, isError, refetch } = useAdminBanners()
  const remove = useDeleteBanner()
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const ofType = banners.filter((b) => b.type === type)
  const counts = Object.fromEntries(TYPE_VALUES.map((t) => [t, banners.filter((b) => b.type === t).length]))
  const nextOrder = ofType.reduce((max, b) => Math.max(max, (b.order ?? 0) + 1), 0)
  const current = TYPES.find((t) => t.value === type)

  const openNew = () => setEditing({ banner: null })
  const confirmDelete = () =>
    remove.mutate(deleting._id, {
      onSuccess: () => {
        notify.success('Banner deleted')
        setDeleting(null)
      },
      onError: (error) => notify.error('Could not delete banner', { description: errorMessage(error) }),
    })

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Banners" subtitle="Change homepage banners anytime. Schedule them to start and end on their own." action={{ label: 'Add banner', Icon: Plus, onClick: openNew }} />

      <Tabs
        label="Banner type"
        tabs={TYPES.map((t) => ({ value: t.value, label: t.label, count: isLoading ? undefined : counts[t.value] }))}
        value={type}
        onChange={(t) => setParams(t === 'hero' ? {} : { type: t }, { replace: true })}
      />

      {isLoading ? (
        <div role="status" aria-label="Loading" className="flex flex-col gap-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-[126px] rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-border bg-white">
          <ErrorState title="Could not load banners" onRetry={refetch} />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-body-sm text-text-muted">{current.hint}</p>
          {ofType.length === 0 ? (
            <div className="rounded-xl border border-border bg-white">
              <EmptyState Icon={Image} title={`No ${current.label.toLowerCase()} yet`} text="Add one and it shows on the store as soon as it is live." action={{ label: 'Add banner', Icon: Plus, onClick: openNew }} />
            </div>
          ) : (
            <>
              <ul className="flex flex-col gap-3">
                {ofType.map((b) => (
                  <BannerRow key={b._id} banner={b} onEdit={() => setEditing({ banner: b })} onDelete={() => setDeleting(b)} />
                ))}
              </ul>
              <button
                type="button"
                onClick={openNew}
                className="flex h-16 items-center justify-center gap-2 rounded-xl border border-dashed border-on-dark text-[13px] font-semibold text-text-secondary hover:border-primary hover:text-primary"
              >
                <Plus size={16} />
                Add another banner
              </button>
            </>
          )}
        </div>
      )}

      {editing && <BannerForm key={editing.banner?._id ?? 'new'} banner={editing.banner} type={type} nextOrder={nextOrder} onClose={() => setEditing(null)} />}

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        loading={remove.isPending}
        danger
        title="Delete banner?"
        message={deleting && `"${deleting.title?.replace(/\s*\n\s*/g, ' ') || 'This banner'}" will be removed from the store. This cannot be undone.`}
        confirmLabel="Delete"
      />
    </div>
  )
}
