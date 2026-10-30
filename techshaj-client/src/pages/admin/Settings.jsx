import { Mail, MapPin, MessageCircle, MessagesSquare, Phone, Plus, RotateCcw, Save, Settings as SettingsIcon, Trash2, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form'
import { FaFacebook, FaInstagram, FaTiktok, FaWhatsapp, FaYoutube } from 'react-icons/fa'
import { useSearchParams } from 'react-router-dom'
import { z } from 'zod'
import Logo from '../../components/Logo.jsx'
import { Skeleton } from '../../components/Skeleton.jsx'
import Button from '../../components/admin/Button.jsx'
import Card from '../../components/admin/Card.jsx'
import ConfirmDialog from '../../components/admin/ConfirmDialog.jsx'
import EmptyState from '../../components/admin/EmptyState.jsx'
import ErrorState from '../../components/admin/ErrorState.jsx'
import FormField from '../../components/admin/FormField.jsx'
import ImageUploader from '../../components/admin/ImageUploader.jsx'
import PageHeader from '../../components/admin/PageHeader.jsx'
import Tabs from '../../components/admin/Tabs.jsx'
import Toggle from '../../components/admin/Toggle.jsx'
import { inputClass } from '../../components/admin/inputClass.js'
import { useAdminSettings, useSaveSettings } from '../../hooks/useAdminSettings.js'
import { useLeaveGuard } from '../../hooks/useLeaveGuard.js'
import { DEFAULT_STORE_NAME } from '../../lib/branding.js'
import { cn } from '../../lib/cn.js'
import { notify } from '../../lib/notify.jsx'
import { errorMessage, isNotFound } from '../../lib/query.js'
import { slugify } from '../../lib/slug.js'
import { zodResolver } from '../../lib/zodResolver.js'

const TABS = [
  { value: 'store', label: 'Store' },
  { value: 'delivery', label: 'Delivery' },
]

const BRANDING_KEYS = ['name', 'logoUrl', 'faviconUrl']
// GET /settings mixes these into the store fields; they are edited on the Delivery tab.
const NOT_STORE_KEYS = ['_id', 'freeShippingThreshold', 'shippingZones', 'shipping']

// Store fields by card; anything not listed lands in "Other".
const GROUPS = [
  { title: 'Contact info', subtitle: 'Used in the footer, contact page and floating buttons.', keys: ['hotline', 'whatsapp', 'messengerUsername', 'email', 'address'] },
  { title: 'Social links', subtitle: 'Links in the footer and the menu.', keys: ['social'] },
  { title: 'Announcement bar', subtitle: 'Scrolling messages at the top of every page.', keys: ['announcements'] },
  { title: 'Mobile payment numbers', subtitle: 'Shown at checkout for bKash and Nagad.', keys: ['mobilePayments'] },
  { title: 'Payment icons', subtitle: 'Payment methods shown in the footer.', keys: ['paymentMethods'] },
  { title: 'Footer', subtitle: 'Footer links and product lists (product ids).', keys: ['footerLinks', 'footerProducts'] },
]

const LABELS = {
  hotline: 'Hotline',
  whatsapp: 'WhatsApp number',
  messengerUsername: 'Messenger page username',
  email: 'Email',
  address: 'Address',
  'social.whatsapp': 'WhatsApp link',
  'social.youtube': 'YouTube',
  'social.tiktok': 'TikTok',
  shortName: 'Short name',
  to: 'Link',
}

const ICONS = {
  hotline: Phone,
  whatsapp: MessageCircle,
  messengerUsername: MessagesSquare,
  email: Mail,
  address: MapPin,
  'social.facebook': FaFacebook,
  'social.instagram': FaInstagram,
  'social.whatsapp': FaWhatsapp,
  'social.youtube': FaYoutube,
  'social.tiktok': FaTiktok,
}

const humanize = (key) => {
  const text = String(key)
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .toLowerCase()
  return text.charAt(0).toUpperCase() + text.slice(1)
}
const labelOf = (path) => LABELS[path.join('.')] ?? LABELS[path.at(-1)] ?? humanize(path.at(-1))
const getIn = (obj, path) => path.reduce((node, key) => node?.[key], obj)

const isScalar = (v) => v === null || v === undefined || ['string', 'number', 'boolean'].includes(typeof v)
const isScalarList = (v) => Array.isArray(v) && v.every(isScalar)
const isNumberList = (v) => isScalarList(v) && v.length > 0 && v.every((x) => typeof x === 'number')
const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)
const mapValues = (obj, fn) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, fn(v, k)]))

// Saved value -> form value: lists of text become one item per line, numbers become text.
function toForm(value) {
  if (isScalarList(value)) return value.join('\n')
  if (Array.isArray(value)) return value.map(toForm)
  if (isPlainObject(value)) return mapValues(value, toForm)
  if (typeof value === 'boolean') return value
  return value == null ? '' : String(value)
}

// Form value -> saved value, shaped like the original.
function fromForm(value, original) {
  if (isScalarList(original)) {
    const lines = String(value ?? '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
    return isNumberList(original) ? lines.map(Number) : lines
  }
  if (Array.isArray(original)) return original.map((o, i) => fromForm(value?.[i], o))
  if (isPlainObject(original)) return mapValues(original, (o, k) => fromForm(value?.[k], o))
  if (typeof original === 'number') return value === '' ? null : Number(value)
  if (typeof original === 'boolean') return Boolean(value)
  return typeof value === 'string' ? value.trim() : value
}

const emailSchema = z.email()

// A zod schema shaped like the saved store, checking emails, links and numbers.
function schemaOf(original, path = []) {
  if (isNumberList(original)) {
    return z.string().refine((v) => v.split('\n').every((line) => !line.trim() || /^\d+$/.test(line.trim())), 'Use one number per line')
  }
  if (isScalarList(original)) return z.string()
  if (Array.isArray(original)) return z.tuple(original.map((o, i) => schemaOf(o, [...path, i])))
  if (isPlainObject(original)) return z.object(mapValues(original, (o, k) => schemaOf(o, [...path, k])))
  if (typeof original === 'boolean') return z.boolean()
  if (typeof original === 'number') return z.string().trim().refine((v) => v === '' || Number.isFinite(Number(v)), 'Enter a number')
  const key = path.at(-1)
  if (key === 'email') return z.string().trim().refine((v) => !v || emailSchema.safeParse(v).success, 'Enter a valid email')
  if (path[0] === 'social' || (typeof original === 'string' && /^https?:\/\//.test(original))) {
    return z.string().trim().refine((v) => !v || /^https?:\/\/\S+$/.test(v), 'Start the link with https://')
  }
  return z.string()
}

function StoreField({ path, original, form }) {
  const { register, control, formState } = form
  const name = path.join('.')
  const label = labelOf(path)
  const error = getIn(formState.errors, path)?.message

  if (typeof original === 'boolean') {
    return <Controller control={control} name={name} render={({ field }) => <Toggle checked={field.value} onChange={field.onChange} label={label} />} />
  }
  if (isScalarList(original)) {
    return (
      <FormField label={label} htmlFor={name} error={error} hint={isNumberList(original) ? 'One product id per line.' : 'One per line.'}>
        <textarea id={name} rows={Math.min(Math.max(original.length + 1, 3), 8)} className={cn(inputClass(error), 'h-auto resize-y py-3')} {...register(name)} />
      </FormField>
    )
  }
  if (Array.isArray(original)) {
    const item = labelOf(path).replace(/s$/, '')
    return (
      <div className="flex flex-col gap-3">
        {path.length > 1 && <p className="text-[13px] font-semibold text-text">{label}</p>}
        {original.map((o, i) => (
          <fieldset key={i} className="flex flex-col gap-3 rounded-lg border border-border p-3">
            <legend className="px-1 text-label-sm text-text-muted">
              {item} {i + 1}
            </legend>
            <StoreFields value={o} path={[...path, i]} form={form} />
          </fieldset>
        ))}
      </div>
    )
  }
  if (isPlainObject(original)) {
    return (
      <div className="flex flex-col gap-3">
        {path.length > 1 && <p className="text-[13px] font-semibold text-text">{label}</p>}
        <StoreFields value={original} path={path} form={form} />
      </div>
    )
  }

  const Icon = ICONS[name]
  const type = path.at(-1) === 'email' ? 'email' : typeof original === 'number' ? 'number' : 'text'
  return (
    <FormField label={label} htmlFor={name} error={error}>
      <div className="relative">
        {Icon && <Icon size={15} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-text-muted" />}
        <input id={name} type={type} aria-invalid={Boolean(error)} className={cn(inputClass(error), Icon && 'pl-10')} {...register(name)} />
      </div>
    </FormField>
  )
}

function StoreFields({ value, path, form }) {
  const entries = Array.isArray(value) ? value.map((v, i) => [i, v]) : Object.entries(value)
  const simple = entries.every(([, v]) => isScalar(v) && typeof v !== 'boolean')
  return (
    <div className={cn('grid gap-3', simple && entries.length > 1 && path.length > 1 && 'sm:grid-cols-2')}>
      {entries.map(([k, v]) => (
        <StoreField key={k} path={[...path, k]} original={v} form={form} />
      ))}
    </div>
  )
}

function LogoPreview({ name, logoUrl }) {
  const brand = { name: name.trim() || DEFAULT_STORE_NAME, logoUrl: logoUrl || null }
  return (
    <div className="grid gap-2.5 sm:grid-cols-2">
      <div className="flex h-[88px] items-center justify-center overflow-hidden rounded-[10px] border border-border-strong bg-white px-4">
        <Logo size="md" brand={brand} onLight />
      </div>
      <div className="flex h-[88px] items-center justify-center overflow-hidden rounded-[10px] bg-dark px-4">
        <Logo size="md" brand={brand} />
      </div>
    </div>
  )
}

// A browser tab with the favicon at 32px, and a note when it is not a square PNG of 64px or more.
function FaviconPreview({ name, faviconUrl }) {
  const [size, setSize] = useState(null)
  const src = faviconUrl || '/favicon.svg'
  const warning =
    faviconUrl && size
      ? size.width !== size.height
        ? `This image is ${size.width} × ${size.height}. Use a square image.`
        : size.width < 64
          ? `This image is ${size.width} × ${size.height}. Use at least 64 × 64.`
          : !/\.png(\?|$)/i.test(faviconUrl)
            ? 'A PNG works best in every browser.'
            : null
      : null
  return (
    <div className="flex flex-col gap-1.5">
      <div className="rounded-[10px] bg-fill px-3 pt-2.5">
        <div className="flex w-full max-w-[280px] items-center gap-2 rounded-t-lg bg-white px-2.5 py-2">
          <img key={src} src={src} alt="Favicon preview" onLoad={(e) => setSize({ width: e.currentTarget.naturalWidth, height: e.currentTarget.naturalHeight })} className="size-8 shrink-0 rounded object-contain" />
          <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-text">{name.trim() || DEFAULT_STORE_NAME}</span>
          <X size={12} className="shrink-0 text-text-faint" />
        </div>
      </div>
      {warning && <p className="text-body-sm font-medium text-highlight-ink">{warning}</p>}
    </div>
  )
}

const brandingSchema = z.object({
  name: z.string().trim().min(1, 'Enter the store name').max(60, 'Keep the name under 60 characters'),
  logoUrl: z.string(),
  faviconUrl: z.string(),
})

function BrandingCard({ settings, onDirtyChange }) {
  const defaults = useMemo(() => ({ name: settings.name ?? '', logoUrl: settings.logoUrl ?? '', faviconUrl: settings.faviconUrl ?? '' }), [settings])
  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm({ resolver: zodResolver(brandingSchema), defaultValues: defaults })
  const [name, logoUrl, faviconUrl] = useWatch({ control, name: ['name', 'logoUrl', 'faviconUrl'] })
  const save = useSaveSettings()

  useEffect(() => onDirtyChange(isDirty), [isDirty, onDirtyChange])

  const setImage = (field) => (urls) => setValue(field, urls.at(-1) ?? '', { shouldDirty: true })

  const onSubmit = (values) =>
    save.mutate(
      { store: values },
      {
        onSuccess: () => {
          notify.success('Branding saved', { description: 'The store shows the new name and images now.' })
          reset(values)
        },
        onError: (error) => notify.error('Could not save branding', { description: errorMessage(error) }),
      },
    )

  const resetButton = (field) => (
    <Button variant="ghost" Icon={RotateCcw} onClick={() => setValue(field, '', { shouldDirty: true })} disabled={!(field === 'logoUrl' ? logoUrl : faviconUrl)} className="h-8 px-2.5 text-[12px]">
      Reset to default
    </Button>
  )

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Card
        title="Branding"
        subtitle="The store name, logo and browser tab icon on every page."
        aside={
          <Button type="submit" Icon={Save} loading={save.isPending} disabled={!isDirty} className="max-sm:hidden">
            Save branding
          </Button>
        }
      >
        <FormField label="Site name" htmlFor="brand-name" required error={errors.name?.message} hint="Shown in the header, footer and browser tab titles.">
          <input id="brand-name" placeholder={DEFAULT_STORE_NAME} aria-invalid={Boolean(errors.name)} className={inputClass(errors.name)} {...register('name')} />
        </FormField>

        <div className="grid gap-5 lg:grid-cols-2">
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[13px] font-semibold text-text">Logo</p>
              {resetButton('logoUrl')}
            </div>
            <LogoPreview name={name} logoUrl={logoUrl} />
            <ImageUploader value={logoUrl ? [logoUrl] : []} max={1} multiple={false} onChange={setImage('logoUrl')} />
            <p className="text-body-sm text-text-muted">A wide PNG or WEBP with a transparent background. Empty: the built-in logo.</p>
          </div>
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[13px] font-semibold text-text">Favicon (browser tab icon)</p>
              {resetButton('faviconUrl')}
            </div>
            <FaviconPreview name={name} faviconUrl={faviconUrl} />
            <ImageUploader value={faviconUrl ? [faviconUrl] : []} max={1} multiple={false} onChange={setImage('faviconUrl')} />
            <p className="text-body-sm text-text-muted">A square PNG, at least 64 × 64 px. Empty: the built-in icon.</p>
          </div>
        </div>

        <Button type="submit" Icon={Save} loading={save.isPending} disabled={!isDirty} className="w-full sm:hidden">
          Save branding
        </Button>
      </Card>
    </form>
  )
}

function StoreFieldsForm({ store, onDirtyChange }) {
  const [saved, setSaved] = useState(store)
  const schema = useMemo(() => schemaOf(saved), [saved])
  const form = useForm({ resolver: zodResolver(schema), defaultValues: toForm(saved) })
  const {
    handleSubmit,
    reset,
    formState: { isDirty },
  } = form
  const save = useSaveSettings()

  useEffect(() => onDirtyChange(isDirty), [isDirty, onDirtyChange])

  const keys = Object.keys(saved)
  const listed = GROUPS.flatMap((g) => g.keys)
  const groups = [...GROUPS, { title: 'Other', subtitle: 'More store fields.', keys: keys.filter((k) => !listed.includes(k)) }]
    .map((g) => ({ ...g, keys: g.keys.filter((k) => keys.includes(k)) }))
    .filter((g) => g.keys.length)

  const onSubmit = (values) => {
    const next = mapValues(saved, (original, key) => fromForm(values[key], original))
    const changed = Object.fromEntries(Object.entries(next).filter(([key, value]) => JSON.stringify(value) !== JSON.stringify(saved[key])))
    if (!Object.keys(changed).length) {
      notify.info('No changes to save')
      return
    }
    save.mutate(
      { store: changed },
      {
        onSuccess: () => {
          notify.success('Store settings saved', { description: `${Object.keys(changed).length} ${Object.keys(changed).length === 1 ? 'field' : 'fields'} updated` })
          setSaved(next)
          reset(toForm(next))
        },
        onError: (error) => notify.error('Could not save settings', { description: errorMessage(error) }),
      },
    )
  }

  if (!groups.length) {
    return (
      <div className="rounded-xl border border-border bg-white">
        <EmptyState Icon={SettingsIcon} title="No other store fields" text="Run the seed to fill in contact info, links and payment numbers." />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit, () => notify.error('Please fix the highlighted fields'))} noValidate className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] text-text-muted">Everything here updates the header, footer and contact buttons on every page.</p>
        <Button type="submit" Icon={Save} loading={save.isPending} disabled={!isDirty}>
          Save settings
        </Button>
      </div>
      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        {groups.map((g) => (
          <Card key={g.title} title={g.title} subtitle={g.subtitle}>
            {g.keys.map((key) => (
              <StoreField key={key} path={[key]} original={saved[key]} form={form} />
            ))}
          </Card>
        ))}
      </div>
    </form>
  )
}

function StoreTab({ settings, onDirtyChange }) {
  const [dirty, setDirty] = useState({ branding: false, fields: false })
  const store = useMemo(() => Object.fromEntries(Object.entries(settings).filter(([k]) => !NOT_STORE_KEYS.includes(k) && !BRANDING_KEYS.includes(k))), [settings])
  const setBranding = useMemo(() => (value) => setDirty((d) => (d.branding === value ? d : { ...d, branding: value })), [])
  const setFields = useMemo(() => (value) => setDirty((d) => (d.fields === value ? d : { ...d, fields: value })), [])

  useEffect(() => onDirtyChange(dirty.branding || dirty.fields), [dirty, onDirtyChange])
  useEffect(() => () => onDirtyChange(false), [onDirtyChange])

  return (
    <div className="flex flex-col gap-4">
      <BrandingCard settings={settings} onDirtyChange={setBranding} />
      <StoreFieldsForm store={store} onDirtyChange={setFields} />
    </div>
  )
}

// New zones get an id from their name, kept unique against every other zone; saved zones keep theirs.
function zoneIds(zones) {
  const taken = new Set(zones.filter((z) => !z.isNew).map((z) => z.zoneId))
  return zones.map((z) => {
    if (!z.isNew) return z.zoneId
    const base = slugify(z.name) || 'zone'
    let id = base
    for (let n = 2; taken.has(id); n++) id = `${base}-${n}`
    taken.add(id)
    return id
  })
}

const zonesSchema = z.object({
  zones: z
    .array(
      z.object({
        zoneId: z.string(),
        isNew: z.boolean(),
        name: z
          .string()
          .trim()
          .min(1, 'Enter a zone name')
          .refine((v) => slugify(v), 'Use letters or numbers in the name'),
        nameBn: z.string().trim(),
        charge: z
          .string()
          .trim()
          .regex(/^\d+(\.\d+)?$/, 'Enter 0 or more'),
        days: z.string().trim(),
      }),
    )
    .min(1, 'Add at least one zone'),
  freeShippingThreshold: z
    .string()
    .trim()
    .refine((v) => v === '' || Number(v) >= 0, 'Enter 0 or more'),
})

const blankZone = () => ({ zoneId: '', isNew: true, name: '', nameBn: '', charge: '', days: '' })

const toDeliveryForm = (settings) => {
  const zones = (settings.shippingZones ?? []).map((z) => ({ zoneId: z.id, isNew: false, name: z.name ?? '', nameBn: z.nameBn ?? '', charge: String(z.charge ?? 0), days: z.days ?? '' }))
  return { zones: zones.length ? zones : [blankZone()], freeShippingThreshold: settings.freeShippingThreshold == null ? '' : String(settings.freeShippingThreshold) }
}

function DeliveryTab({ settings, onDirtyChange }) {
  const defaults = useMemo(() => toDeliveryForm(settings), [settings])
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm({ resolver: zodResolver(zonesSchema), defaultValues: defaults })
  const { fields, append, remove } = useFieldArray({ control, name: 'zones' })
  const zones = useWatch({ control, name: 'zones' })
  const ids = zoneIds(zones)
  const save = useSaveSettings()

  useEffect(() => onDirtyChange(isDirty), [isDirty, onDirtyChange])
  useEffect(() => () => onDirtyChange(false), [onDirtyChange])

  const onSubmit = (values) => {
    const resolved = zoneIds(values.zones)
    const shippingZones = values.zones.map((z, i) => ({ id: resolved[i], name: z.name, nameBn: z.nameBn, charge: Number(z.charge), days: z.days }))
    const freeShippingThreshold = values.freeShippingThreshold === '' ? null : Number(values.freeShippingThreshold)
    save.mutate(
      { shippingZones, freeShippingThreshold },
      {
        onSuccess: () => {
          notify.success('Delivery settings saved', { description: `${shippingZones.length} ${shippingZones.length === 1 ? 'zone' : 'zones'} at checkout` })
          reset({ ...values, zones: values.zones.map((z, i) => ({ ...z, zoneId: resolved[i], isNew: false })) })
        },
        onError: (error) => notify.error('Could not save delivery settings', { description: errorMessage(error) }),
      },
    )
  }

  const zoneError = (i, key) => errors.zones?.[i]?.[key]?.message

  return (
    <form onSubmit={handleSubmit(onSubmit, () => notify.error('Please fix the highlighted fields'))} noValidate className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] text-text-muted">These values appear at checkout and on the Shipping page.</p>
        <Button type="submit" Icon={Save} loading={save.isPending} disabled={!isDirty}>
          Save changes
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <Card
          title="Delivery zones"
          subtitle="Customers pick one of these at checkout. Saving replaces the whole list."
          aside={
            <Button variant="secondary" Icon={Plus} onClick={() => append(blankZone())}>
              Add zone
            </Button>
          }
        >
          <div className="hidden grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_96px_minmax(0,0.9fr)_32px] gap-2.5 px-1 text-[11px] font-semibold text-text-muted uppercase lg:grid">
            <span>Zone name</span>
            <span>Name in Bangla</span>
            <span>Charge (৳)</span>
            <span>Delivery time</span>
            <span className="sr-only">Remove</span>
          </div>
          <ul className="flex flex-col gap-3 lg:gap-2.5">
            {fields.map((field, i) => (
              <li key={field.id} className="grid grid-cols-2 gap-2.5 rounded-lg border border-border p-3 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_96px_minmax(0,0.9fr)_32px] lg:items-start lg:border-0 lg:p-0">
                <FormField error={zoneError(i, 'name')} hint={`ID: ${ids[i] || '—'}`} className="col-span-2 lg:col-span-1">
                  <input aria-label={`Zone ${i + 1} name`} placeholder="Inside Dhaka" aria-invalid={Boolean(zoneError(i, 'name'))} className={cn(inputClass(zoneError(i, 'name')), 'h-10')} {...register(`zones.${i}.name`)} />
                </FormField>
                <input aria-label={`Zone ${i + 1} name in Bangla`} placeholder="ঢাকার ভিতরে" className={cn(inputClass(), 'col-span-2 h-10 font-bangla lg:col-span-1')} {...register(`zones.${i}.nameBn`)} />
                <FormField error={zoneError(i, 'charge')}>
                  <input aria-label={`Zone ${i + 1} charge in taka`} type="number" inputMode="numeric" min="0" placeholder="70" aria-invalid={Boolean(zoneError(i, 'charge'))} className={cn(inputClass(zoneError(i, 'charge')), 'h-10 font-semibold')} {...register(`zones.${i}.charge`)} />
                </FormField>
                <input aria-label={`Zone ${i + 1} delivery time`} placeholder="1-2 days" className={cn(inputClass(), 'h-10')} {...register(`zones.${i}.days`)} />
                <button
                  type="button"
                  onClick={() => remove(i)}
                  disabled={fields.length === 1}
                  aria-label={`Remove zone ${i + 1}`}
                  title={fields.length === 1 ? 'At least one zone is required' : undefined}
                  className="col-span-2 flex h-10 items-center justify-center gap-1.5 rounded-lg text-[13px] font-semibold text-error hover:bg-error-tint disabled:cursor-not-allowed disabled:opacity-40 lg:col-span-1 lg:w-8"
                >
                  <Trash2 size={16} />
                  <span className="lg:sr-only">Remove zone</span>
                </button>
              </li>
            ))}
          </ul>
          {errors.zones?.message && <p className="text-body-sm font-medium text-error">{errors.zones.message}</p>}
        </Card>

        <Card title="Free delivery" subtitle="Shown in the top bar and the cart progress bar.">
          <FormField label="Free when the order is at least (৳)" htmlFor="free-threshold" error={errors.freeShippingThreshold?.message} hint="Orders at or above this amount ship free. Leave empty to charge delivery on every order.">
            <input id="free-threshold" type="number" inputMode="numeric" min="0" placeholder="3000" aria-invalid={Boolean(errors.freeShippingThreshold)} className={inputClass(errors.freeShippingThreshold)} {...register('freeShippingThreshold')} />
          </FormField>
        </Card>
      </div>
    </form>
  )
}

function SettingsSkeleton() {
  return (
    <div role="status" aria-label="Loading" className="flex flex-col gap-4">
      <Skeleton className="h-[420px] rounded-xl" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-[320px] rounded-xl" />
        <Skeleton className="h-[320px] rounded-xl" />
      </div>
    </div>
  )
}

// Figma "Store Settings" (63:10554) and "Delivery & Payment" (63:10183).
export default function Settings() {
  const [params, setParams] = useSearchParams()
  const tab = TABS.some((t) => t.value === params.get('tab')) ? params.get('tab') : 'store'
  const { data, isLoading, error, refetch } = useAdminSettings()
  // No settings document yet: start empty, the first save creates it.
  const settings = data ?? (isNotFound(error) ? {} : null)

  const [dirty, setDirty] = useState(false)
  const [pendingTab, setPendingTab] = useState(null)
  const guard = useLeaveGuard(dirty)

  const goTo = (value) => setParams(value === 'store' ? {} : { tab: value }, { replace: true })
  const switchTab = (value) => {
    if (value === tab) return
    if (dirty) setPendingTab(value)
    else goTo(value)
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Settings" subtitle="Store details, branding and delivery charges." />
      <Tabs label="Settings section" tabs={TABS} value={tab} onChange={switchTab} />

      {isLoading ? (
        <SettingsSkeleton />
      ) : !settings ? (
        <div className="rounded-xl border border-border bg-white">
          <ErrorState title="Could not load settings" onRetry={refetch} />
        </div>
      ) : tab === 'store' ? (
        <StoreTab settings={settings} onDirtyChange={setDirty} />
      ) : (
        <DeliveryTab settings={settings} onDirtyChange={setDirty} />
      )}

      <ConfirmDialog
        open={Boolean(pendingTab) || Boolean(guard.pending)}
        onClose={() => {
          setPendingTab(null)
          guard.cancel()
        }}
        onConfirm={() => {
          if (pendingTab) {
            goTo(pendingTab)
            setPendingTab(null)
            setDirty(false)
          } else guard.confirm()
        }}
        danger
        title="Leave without saving?"
        message="You have unsaved changes on this tab. They will be lost."
        confirmLabel="Leave"
        cancelLabel="Keep editing"
      />
    </div>
  )
}
