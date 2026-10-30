import { Calendar, Image, ImageOff, Link2, Pencil, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { useSearchParams } from 'react-router-dom'
import { z } from 'zod'
import { Skeleton } from '../../components/Skeleton.jsx'
import Button from '../../components/admin/Button.jsx'
import ConfirmDialog from '../../components/admin/ConfirmDialog.jsx'
import EmptyState from '../../components/admin/EmptyState.jsx'
import ErrorState from '../../components/admin/ErrorState.jsx'
import FormField from '../../components/admin/FormField.jsx'
import ImageUploader from '../../components/admin/ImageUploader.jsx'
import LinkTargetPicker from '../../components/admin/LinkTargetPicker.jsx'
import Modal from '../../components/admin/Modal.jsx'
import PageHeader from '../../components/admin/PageHeader.jsx'
import Select from '../../components/admin/Select.jsx'
import Tabs from '../../components/admin/Tabs.jsx'
import Toggle from '../../components/admin/Toggle.jsx'
import { inputClass } from '../../components/admin/inputClass.js'
import { useAdminBanners, useDeleteBanner, useSaveBanner } from '../../hooks/useAdminBanners.js'
import { useAllAdminProducts } from '../../hooks/useAdminProducts.js'
import { useCategories } from '../../hooks/useCategories.js'
import { LINK_TARGETS, isValidCustomLink, linkFromTarget, targetFromLink } from '../../lib/bannerLink.js'
import { formatDate, fromDhakaInput, toDhakaInput } from '../../lib/adminFormat.js'
import { cn } from '../../lib/cn.js'
import { notify } from '../../lib/notify.jsx'
import { errorMessage } from '../../lib/query.js'
import { zodResolver } from '../../lib/zodResolver.js'

const TYPES = [
  { value: 'hero', label: 'Hero slider', hint: 'Big slides at the top of the homepage.', size: '1600 × 780 px', ratio: 'aspect-[2/1]' },
  { value: 'side', label: 'Side banners', hint: 'Two banners next to the hero slider (desktop) or under it (mobile).', size: '600 × 440 px', ratio: 'aspect-[1.35/1]' },
  { value: 'promo', label: 'Promo banners', hint: 'Wide banners between homepage sections on desktop.', size: '1200 × 300 px', ratio: 'aspect-[4/1]' },
  { value: 'menu', label: 'Menu banner', hint: 'The banner inside the All Categories menu. Only the first live one shows.', size: '520 × 640 px', ratio: 'aspect-[13/16]' },
]
const TYPE_VALUES = TYPES.map((t) => t.value)
const typeOf = (value) => TYPES.find((t) => t.value === value) ?? TYPES[0]

const iconButton = 'flex size-11 md:size-8 items-center justify-center rounded-lg border border-border-strong text-text-secondary hover:border-text-faint hover:text-text'

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
    name: z.string().trim().max(80, 'Keep the name under 80 characters'),
    linkTarget: z.object({ type: z.enum(LINK_TARGETS.map((t) => t.value)), value: z.string() }),
    active: z.boolean(),
    startAt: z.string(),
    endAt: z.string(),
    order: z.string().trim().regex(/^-?\d+$/, 'Order must be a whole number'),
  })
  // Both are "YYYY-MM-DDTHH:mm", so text order is time order.
  .refine((v) => !v.startAt || !v.endAt || v.endAt > v.startAt, { path: ['endAt'], message: 'End must be after the start' })
  .superRefine(({ linkTarget: t }, ctx) => {
    const value = t.value.trim()
    const needs = { category: 'Choose a category', product: 'Pick a product', collection: 'Choose a collection', page: 'Choose a page', custom: 'Enter a link' }
    if (needs[t.type] && !value) ctx.addIssue({ code: 'custom', path: ['linkTarget'], message: needs[t.type] })
    else if (t.type === 'custom' && !isValidCustomLink(value)) ctx.addIssue({ code: 'custom', path: ['linkTarget'], message: 'Use a path starting with / or a full https:// link' })
  })

const targetOf = (b) => (b?.linkTarget?.type ? { type: b.linkTarget.type, value: b.linkTarget.value ?? '' } : targetFromLink(b?.link))

const toFormValues = (b, type) => ({
  type: b?.type ?? type,
  image: b?.image ? [b.image] : [],
  name: b?.name ?? '',
  linkTarget: targetOf(b),
  active: b ? b.active !== false : true,
  startAt: toDhakaInput(b?.startAt),
  endAt: toDhakaInput(b?.endAt),
  order: String(b?.order ?? 0),
})

const toPayload = (v) => {
  const linkTarget = { type: v.linkTarget.type, value: v.linkTarget.value.trim() }
  return {
    type: v.type,
    image: v.image[0] ?? '',
    name: v.name.trim(),
    link: linkFromTarget(linkTarget),
    linkTarget,
    active: v.active,
    startAt: fromDhakaInput(v.startAt),
    endAt: fromDhakaInput(v.endAt),
    order: Number(v.order),
  }
}

const bannerName = (b) => b.name?.trim() || `${typeOf(b.type).label.replace(/s$/, '')} #${b.id ?? ''}`.trim()

// A category or product that was picked but is no longer in the catalog.
function isTargetMissing(banner, categories, products) {
  const t = targetOf(banner)
  if (t.type === 'category' && categories) return !categories.some((p) => p.slug === t.value || p.children.some((c) => c.slug === t.value))
  if (t.type === 'product' && products) return !products.some((p) => p.slug === t.value)
  return false
}

// What customers see: the image alone, in the slot's ratio.
function LivePreview({ type, image }) {
  const t = typeOf(type)
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[13px] font-semibold text-text">Live preview</p>
      <div className={cn('w-full overflow-hidden rounded-[14px] bg-fill', t.ratio, { hero: 'max-w-[520px]', side: 'max-w-[300px]', promo: 'max-w-[520px]', menu: 'max-w-[220px]' }[type])}>
        {image ? <img src={image} alt="Banner preview" className="size-full object-cover" /> : <span className="flex size-full items-center justify-center text-body-sm text-text-faint">Upload an image to preview</span>}
      </div>
    </div>
  )
}

function BannerForm({ banner, type, nextOrder, categories, products, onClose }) {
  const isEdit = Boolean(banner)
  const initial = useMemo(() => ({ ...toFormValues(banner, type), ...(!banner && { order: String(nextOrder) }) }), [banner, type, nextOrder])
  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema), defaultValues: initial })
  const [watchType, watchImage] = useWatch({ control, name: ['type', 'image'] })
  const save = useSaveBanner()

  const onSubmit = (values) => {
    const payload = toPayload(values)
    const before = toPayload(initial)
    const data = isEdit ? Object.fromEntries(Object.entries(payload).filter(([k, v]) => JSON.stringify(v) !== JSON.stringify(before[k]))) : payload
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

        <FormField label="Image" required error={errors.image?.message} hint={`Recommended size: ${typeOf(watchType).size}. The image is shown as is, so put any text inside the image.`}>
          <Controller
            control={control}
            name="image"
            render={({ field }) => <ImageUploader value={field.value} max={1} multiple={false} onChange={(urls) => setValue('image', urls.slice(-1), { shouldDirty: true, shouldValidate: true })} />}
          />
        </FormField>

        <LivePreview type={watchType} image={watchImage?.[0]} />

        <Controller
          control={control}
          name="linkTarget"
          render={({ field }) => <LinkTargetPicker value={field.value} onChange={field.onChange} categories={categories} products={products} error={errors.linkTarget?.message} />}
        />

        <FormField label="Internal name" htmlFor="banner-name" error={errors.name?.message} hint="Optional. Only shown in this list, never on the store.">
          <input id="banner-name" placeholder="e.g. Eid sale – power banks" className={inputClass(errors.name)} {...register('name')} />
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

function BannerRow({ banner, missing, onEdit, onDelete }) {
  const save = useSaveBanner()
  const title = bannerName(banner)

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
          {missing && (
            <span title="The category or product this banner opens no longer exists" className="shrink-0 rounded-[10px] bg-error px-2 py-[3px] text-[11px] font-bold whitespace-nowrap text-white">
              Target missing
            </span>
          )}
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
  const { data: categories } = useCategories()
  const { data: products } = useAllAdminProducts()
  const remove = useDeleteBanner()
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const ofType = banners.filter((b) => b.type === type)
  const counts = Object.fromEntries(TYPE_VALUES.map((t) => [t, banners.filter((b) => b.type === t).length]))
  const nextOrder = ofType.reduce((max, b) => Math.max(max, (b.order ?? 0) + 1), 0)
  const current = typeOf(type)

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
          <p className="text-body-sm text-text-muted">
            {current.hint} Recommended image size: {current.size}.
          </p>
          {ofType.length === 0 ? (
            <div className="rounded-xl border border-border bg-white">
              <EmptyState Icon={Image} title={`No ${current.label.toLowerCase()} yet`} text="Add one and it shows on the store as soon as it is live." action={{ label: 'Add banner', Icon: Plus, onClick: openNew }} />
            </div>
          ) : (
            <>
              <ul className="flex flex-col gap-3">
                {ofType.map((b) => (
                  <BannerRow key={b._id} banner={b} missing={isTargetMissing(b, categories, products)} onEdit={() => setEditing({ banner: b })} onDelete={() => setDeleting(b)} />
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

      {editing && <BannerForm key={editing.banner?._id ?? 'new'} banner={editing.banner} type={type} nextOrder={nextOrder} categories={categories} products={products} onClose={() => setEditing(null)} />}

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        loading={remove.isPending}
        danger
        title="Delete banner?"
        message={deleting && `"${bannerName(deleting)}" will be removed from the store. This cannot be undone.`}
        confirmLabel="Delete"
      />
    </div>
  )
}
