import { ChevronLeft, ImagePlus, Images, Minus, PackageX, Plus, Save, Trash2, X } from 'lucide-react'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form'
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom'
import { z } from 'zod'
import { Skeleton } from '../../components/Skeleton.jsx'
import Button from '../../components/admin/Button.jsx'
import CategoryOptions from '../../components/admin/CategoryOptions.jsx'
import ConfirmDialog from '../../components/admin/ConfirmDialog.jsx'
import EmptyState from '../../components/admin/EmptyState.jsx'
import ErrorState from '../../components/admin/ErrorState.jsx'
import FormField from '../../components/admin/FormField.jsx'
import ImageUploader from '../../components/admin/ImageUploader.jsx'
import Select from '../../components/admin/Select.jsx'
import Spinner from '../../components/admin/Spinner.jsx'
import StockBadge from '../../components/admin/StockBadge.jsx'
import Toggle from '../../components/admin/Toggle.jsx'
import { inputClass } from '../../components/admin/inputClass.js'
import { toTree, useAdminCategories } from '../../hooks/useAdminCategories.js'
import { useAdminProduct, useAllAdminProducts, useCreateProduct, useUpdateProduct } from '../../hooks/useAdminProducts.js'
import { IMAGE_TYPES, useImageUpload } from '../../hooks/useImageUpload.js'
import { useLeaveGuard } from '../../hooks/useLeaveGuard.js'
import { formatDate } from '../../lib/adminFormat.js'
import { cn } from '../../lib/cn.js'
import { notify } from '../../lib/notify.jsx'
import { errorMessage, isNotFound } from '../../lib/query.js'
import { labelFromSlug, slugify } from '../../lib/slug.js'
import { nextStock } from '../../lib/stock.js'
import { zodResolver } from '../../lib/zodResolver.js'

const splitOptions = (text) =>
  text
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean)

const schema = z
  .object({
    name: z.string().trim().min(1, 'Enter the product name'),
    slug: z.string(),
    code: z.string(),
    brand: z.string(),
    shortDescription: z.string(),
    description: z.string(),
    categoryId: z.string().min(1, 'Choose a category'),
    price: z
      .string()
      .trim()
      .min(1, 'Enter a price')
      .refine((v) => Number(v) > 0, 'Price must be a positive number'),
    oldPrice: z.string().trim(),
    stock: z.string().trim().regex(/^\d+$/, 'Stock must be a whole number of 0 or more'),
    freeDelivery: z.boolean(),
    isNew: z.boolean(),
    rating: z.string().trim(),
    reviewCount: z.string().trim(),
    soldCount: z.string().trim().regex(/^\d+$/, 'Enter a whole number of 0 or more'),
    autoRating: z.boolean(),
    published: z.boolean(),
    collections: z.array(z.string()),
    images: z.array(z.string()).min(1, 'Add at least 1 image'),
    variants: z.array(z.object({ name: z.string(), options: z.string(), images: z.record(z.string(), z.string()) })),
    specs: z.array(z.object({ label: z.string(), value: z.string() })),
  })
  .superRefine((v, ctx) => {
    // Read-only while real review numbers are used.
    if (!v.autoRating && !(/^\d(\.\d)?$/.test(v.rating) && Number(v.rating) <= 5)) {
      ctx.addIssue({ code: 'custom', path: ['rating'], message: 'Enter 0 to 5 with up to one decimal, e.g. 4.6' })
    }
    if (!v.autoRating && !/^\d+$/.test(v.reviewCount)) ctx.addIssue({ code: 'custom', path: ['reviewCount'], message: 'Enter a whole number of 0 or more' })
    if (v.oldPrice && !(Number(v.oldPrice) > Number(v.price))) {
      ctx.addIssue({ code: 'custom', path: ['oldPrice'], message: 'Old price must be empty or more than the price' })
    }
    v.variants.forEach((row, i) => {
      const hasName = row.name.trim() !== ''
      const hasOptions = splitOptions(row.options).length > 0
      if (hasName && !hasOptions) ctx.addIssue({ code: 'custom', path: ['variants', i, 'options'], message: 'Add at least one option' })
      if (!hasName && hasOptions) ctx.addIssue({ code: 'custom', path: ['variants', i, 'name'], message: 'Enter a name, e.g. Color' })
    })
    v.specs.forEach((row, i) => {
      if (!row.label.trim() && row.value.trim()) ctx.addIssue({ code: 'custom', path: ['specs', i, 'label'], message: 'Enter a label' })
    })
  })

const blank = {
  name: '',
  slug: '',
  code: '',
  brand: '',
  shortDescription: '',
  description: '',
  categoryId: '',
  price: '',
  oldPrice: '',
  stock: '0',
  freeDelivery: false,
  isNew: true,
  rating: '0',
  reviewCount: '0',
  soldCount: '0',
  autoRating: false,
  published: true,
  collections: [],
  images: [],
  variants: [],
  specs: [],
}

const toFormValues = (p) => ({
  name: p.name ?? '',
  slug: p.slug ?? '',
  code: p.code ?? '',
  brand: p.brand ?? '',
  shortDescription: p.shortDescription ?? '',
  description: p.description ?? '',
  categoryId: p.categoryId != null ? String(p.categoryId) : '',
  price: p.price != null ? String(p.price) : '',
  oldPrice: p.oldPrice ? String(p.oldPrice) : '',
  stock: String(p.stock ?? 0),
  freeDelivery: Boolean(p.freeDelivery),
  isNew: Boolean(p.isNew),
  rating: String(p.rating ?? 0),
  reviewCount: String(p.reviewCount ?? 0),
  soldCount: String(p.soldCount ?? 0),
  autoRating: p.ratingMode === 'auto',
  published: p.published !== false,
  collections: p.collections ?? [],
  images: p.images ?? [],
  variants: (p.variants ?? []).map((v) => ({ name: v.name, options: v.options.join(', '), images: p.optionImages?.[v.name] ?? {} })),
  specs: (p.specs ?? []).map((s) => ({ label: s.label, value: s.value })),
})

// Form strings -> the body the server expects. Empty slug and code are left out so the server generates them.
const toPayload = (v) => ({
  name: v.name.trim(),
  ...(v.slug.trim() && { slug: slugify(v.slug) }),
  ...(v.code.trim() && { code: v.code.trim().toUpperCase() }),
  brand: v.brand.trim(),
  shortDescription: v.shortDescription.trim(),
  description: v.description.trim(),
  categoryId: Number(v.categoryId),
  price: Number(v.price),
  oldPrice: v.oldPrice ? Number(v.oldPrice) : null,
  stock: Number(v.stock),
  freeDelivery: v.freeDelivery,
  isNew: v.isNew,
  // With real review numbers the server keeps rating and reviewCount up to date.
  ...(!v.autoRating && { rating: Number(v.rating), reviewCount: Number(v.reviewCount) }),
  soldCount: Number(v.soldCount),
  ratingMode: v.autoRating ? 'auto' : 'manual',
  published: v.published,
  collections: v.collections,
  images: v.images,
  variants: v.variants.filter((r) => r.name.trim()).map((r) => ({ name: r.name.trim(), options: splitOptions(r.options) })),
  // Only pictures of options that still exist are sent.
  optionImages: Object.fromEntries(
    v.variants
      .filter((r) => r.name.trim())
      .map((r) => [r.name.trim(), Object.fromEntries(Object.entries(r.images).filter(([o, url]) => url && splitOptions(r.options).includes(o)))])
      .filter(([, images]) => Object.keys(images).length),
  ),
  specs: v.specs.filter((r) => r.label.trim()).map((r) => ({ label: r.label.trim(), value: r.value.trim() })),
})

const changedFields = (next, base) => Object.fromEntries(Object.entries(next).filter(([k, v]) => JSON.stringify(v) !== JSON.stringify(base[k])))

// Quick Add / Remove under the stock field; the change is saved with the form.
function StockQuickAdjust({ saved, value, onChange }) {
  const [amount, setAmount] = useState('1')
  const current = /^\d+$/.test(String(value).trim()) ? Number(value) : 0
  const valid = /^\d+$/.test(amount.trim()) && Number(amount) > 0
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5 rounded-lg bg-fill-soft p-3">
      {saved != null && (
        <span className="flex items-center gap-2 text-[13px] text-text-muted">
          Current stock <StockBadge stock={saved} />
        </span>
      )}
      <div className="flex items-center gap-2 sm:ml-auto">
        <input
          type="number"
          inputMode="numeric"
          min="1"
          step="1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          aria-label="Quantity to add or remove"
          className={cn(inputClass(), 'h-9 w-20 px-2.5 text-center')}
        />
        <Button variant="secondary" Icon={Plus} disabled={!valid} onClick={() => onChange(nextStock(current, 'add', amount))} className="h-11 px-3 md:h-9">
          Add
        </Button>
        <Button variant="secondary" Icon={Minus} disabled={!valid || current === 0} onClick={() => onChange(nextStock(current, 'remove', amount))} className="h-11 px-3 md:h-9">
          Remove
        </Button>
      </div>
    </div>
  )
}

function Card({ title, aside, children, className }) {
  return (
    <section className={cn('flex flex-col gap-4 rounded-xl border border-border bg-white p-5', className)}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-h4 text-text">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  )
}

function FlagRow({ label, hint, children }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex flex-col gap-0.5">
        <span className="text-[13px] font-semibold text-text">{label}</span>
        {hint && <span className="text-body-sm text-text-muted">{hint}</span>}
      </div>
      {children}
    </div>
  )
}

// One option's picture: upload one, pick a gallery image, or remove it.
function OptionPicture({ option, url, gallery, onChange }) {
  const { upload } = useImageUpload()
  const [progress, setProgress] = useState(null)
  const [error, setError] = useState(null)
  const [picking, setPicking] = useState(false)
  const inputId = useId()

  const onFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setError(null)
    setProgress(0)
    try {
      onChange(await upload(file, { onProgress: setProgress }))
      setPicking(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setProgress(null)
    }
  }

  return (
    <li className="flex w-[148px] flex-col gap-2 rounded-[10px] border border-border bg-white p-2">
      <div className="flex items-center gap-2">
        <span className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-border-strong bg-fill-soft text-text-faint">
          {url ? (
            <img src={url} alt={`${option} picture`} className="size-full object-cover" />
          ) : progress != null ? (
            <span role="status" aria-label={`Uploading ${progress}%`} className="text-primary">
              <Spinner size={16} />
            </span>
          ) : (
            <ImagePlus size={16} />
          )}
        </span>
        <span className="min-w-0 flex-1 truncate text-[12px] font-semibold text-text">{option}</span>
        {url && (
          <button type="button" onClick={() => onChange('')} aria-label={`Remove ${option} picture`} className="flex size-8 shrink-0 items-center justify-center rounded-md text-error hover:bg-error-tint">
            <X size={14} />
          </button>
        )}
      </div>
      <div className="flex gap-1.5">
        <label htmlFor={inputId} className="flex h-8 flex-1 cursor-pointer items-center justify-center rounded-md border border-border-strong text-[11px] font-semibold text-text hover:border-primary hover:text-primary">
          Upload
        </label>
        <input id={inputId} type="file" accept={IMAGE_TYPES.join(',')} onChange={onFile} aria-label={`Upload ${option} picture`} className="sr-only" />
        <button
          type="button"
          onClick={() => setPicking(!picking)}
          disabled={!gallery.length}
          aria-expanded={picking}
          aria-label={`Pick ${option} picture from gallery`}
          className={cn('flex h-8 flex-1 items-center justify-center gap-1 rounded-md border text-[11px] font-semibold disabled:opacity-40', picking ? 'border-primary text-primary' : 'border-border-strong text-text hover:border-primary hover:text-primary')}
        >
          <Images size={13} />
          Gallery
        </button>
      </div>
      {picking && (
        <div className="grid grid-cols-3 gap-1">
          {[...new Set(gallery)].map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => {
                onChange(src)
                setPicking(false)
              }}
              aria-label={`Use gallery image ${i + 1} for ${option}`}
              className={cn('aspect-square overflow-hidden rounded-md border-2', src === url ? 'border-primary' : 'border-transparent hover:border-primary-soft')}
            >
              <img src={src} alt="" className="size-full object-cover" />
            </button>
          ))}
        </div>
      )}
      {error && (
        <p role="alert" className="text-[11px] font-medium text-error">
          {error}
        </p>
      )}
    </li>
  )
}

// Picture slots for every option of one variant row.
function OptionPictures({ index, control, getValues, setValue }) {
  const [optionsText, images = {}, gallery = []] = useWatch({ control, name: [`variants.${index}.options`, `variants.${index}.images`, 'images'] })
  const options = [...new Set(splitOptions(optionsText ?? ''))]
  if (!options.length) return null

  // An uploaded option picture is also added to the gallery.
  const setImage = (option, url) => {
    const next = { ...getValues(`variants.${index}.images`) }
    if (url) next[option] = url
    else delete next[option]
    setValue(`variants.${index}.images`, next, { shouldDirty: true })
    const current = getValues('images')
    if (url && !current.includes(url)) setValue('images', [...current, url], { shouldDirty: true, shouldValidate: true })
  }

  return (
    <div className="col-span-full flex flex-col gap-2">
      <span className="text-body-sm text-text-muted">Option pictures (optional). Choosing the option on the store shows its picture.</span>
      <ul className="flex flex-wrap gap-2">
        {options.map((o) => (
          <OptionPicture key={o} option={o} url={images[o]} gallery={gallery} onChange={(url) => setImage(o, url)} />
        ))}
      </ul>
    </div>
  )
}

const rowButton = 'flex size-12 shrink-0 items-center justify-center rounded-[10px] text-error hover:bg-error-tint'

function FormSkeleton() {
  return (
    <div role="status" aria-label="Loading" className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="flex flex-col gap-4">
        <Skeleton className="h-[360px] rounded-xl" />
        <Skeleton className="h-[200px] rounded-xl" />
      </div>
      <div className="flex flex-col gap-4">
        <Skeleton className="h-[140px] rounded-xl" />
        <Skeleton className="h-[200px] rounded-xl" />
      </div>
    </div>
  )
}

// Figma "Admin – Add / Edit Product" (59:8724). The editor mounts once the product is loaded, keyed by id.
export default function ProductForm() {
  const { id } = useParams()
  const { state } = useLocation()
  const isEdit = Boolean(id)
  const product = useAdminProduct(id, state?.code)

  if (isEdit && product.isError) {
    return (
      <div className="flex flex-col gap-5">
        <BackLink title="Edit product" />
        <div className="rounded-xl border border-border bg-white">
          {isNotFound(product.error) ? (
            <EmptyState Icon={PackageX} title="Product not found" text="It may have been deleted." action={{ label: 'Back to products', to: '/admin/products' }} />
          ) : (
            <ErrorState onRetry={product.refetch} />
          )}
        </div>
      </div>
    )
  }
  if (isEdit && !product.data) {
    return (
      <div className="flex flex-col gap-5">
        <BackLink title="Edit product" />
        <FormSkeleton />
      </div>
    )
  }
  return <ProductEditor key={id ?? 'new'} product={isEdit ? product.data : null} />
}

function BackLink({ title }) {
  return (
    <div className="flex flex-col gap-1">
      <Link to="/admin/products" className="flex w-fit items-center gap-1 text-[13px] font-medium text-text-muted hover:text-text">
        <ChevronLeft size={16} />
        Products
      </Link>
      <h1 className="text-[20px] font-bold text-text">{title}</h1>
    </div>
  )
}

function ProductEditor({ product }) {
  const isEdit = Boolean(product)
  const initial = useMemo(() => (product ? toFormValues(product) : blank), [product])
  const {
    register,
    control,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors, isDirty },
  } = useForm({ resolver: zodResolver(schema), defaultValues: initial })
  const variants = useFieldArray({ control, name: 'variants' })
  const specs = useFieldArray({ control, name: 'specs' })

  const { data: categories = [], isError: categoriesFailed, refetch: refetchCategories } = useAdminCategories()
  const tree = useMemo(() => toTree(categories), [categories])
  const { data: allProducts = [] } = useAllAdminProducts()
  const collectionOptions = useMemo(
    () => [...new Set([...allProducts.flatMap((p) => p.collections ?? []), ...initial.collections])].sort(),
    [allProducts, initial.collections],
  )

  const create = useCreateProduct()
  const update = useUpdateProduct()
  const saving = create.isPending || update.isPending
  const guard = useLeaveGuard(isDirty && !saving)
  const stock = useWatch({ control, name: 'stock' })
  const autoRating = useWatch({ control, name: 'autoRating' })

  // ?focus=stock (from the dashboard low stock list) jumps straight to the stock field.
  const [searchParams] = useSearchParams()
  const focusStock = searchParams.get('focus') === 'stock'
  useEffect(() => {
    if (!focusStock) return
    const frame = requestAnimationFrame(() => {
      const input = document.getElementById('stock')
      input?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      input?.focus({ preventScroll: true })
      input?.select()
    })
    return () => cancelAnimationFrame(frame)
  }, [focusStock])

  // The slug follows the name until it is edited by hand; an existing product keeps its slug.
  const name = useWatch({ control, name: 'name' })
  const slugEdited = useRef(isEdit)
  useEffect(() => {
    if (!slugEdited.current) setValue('slug', slugify(name))
  }, [name, setValue])

  const onSubmit = (values) => {
    const payload = toPayload(values)
    if (!isEdit) {
      create.mutate(payload, {
        onSuccess: (p) => {
          notify.success('Product created', { description: p.name })
          guard.leave('/admin/products')
        },
        onError: (error) => notify.error('Could not create product', { description: errorMessage(error) }),
      })
      return
    }
    const data = changedFields(payload, toPayload(initial))
    if (!Object.keys(data).length) {
      notify.info('No changes to save')
      return
    }
    update.mutate(
      { id: product.id, data },
      {
        onSuccess: (p) => {
          notify.success('Product saved', { description: p.name })
          guard.leave('/admin/products')
        },
        onError: (error) => notify.error('Could not save product', { description: errorMessage(error) }),
      },
    )
  }

  const onInvalid = () => notify.error('Please fix the highlighted fields')

  // A picture removed from the gallery is also removed from any option that used it.
  const onImagesChange = (urls) => {
    const removed = getValues('images').filter((url) => !urls.includes(url))
    setValue('images', urls, { shouldDirty: true, shouldValidate: Boolean(errors.images) })
    if (!removed.length) return
    getValues('variants').forEach((row, i) => {
      const kept = Object.fromEntries(Object.entries(row.images).filter(([, url]) => !removed.includes(url)))
      if (Object.keys(kept).length !== Object.keys(row.images).length) setValue(`variants.${i}.images`, kept, { shouldDirty: true })
    })
  }

  const text = (field, label, { required, hint, placeholder, multiline, rows = 3, className } = {}) => {
    const Input = multiline ? 'textarea' : 'input'
    return (
      <FormField label={label} htmlFor={field} error={errors[field]?.message} hint={hint} required={required} className={className}>
        <Input
          id={field}
          placeholder={placeholder}
          rows={multiline ? rows : undefined}
          aria-invalid={Boolean(errors[field])}
          className={cn(inputClass(errors[field]), multiline && 'h-auto resize-y py-3')}
          {...register(field)}
        />
      </FormField>
    )
  }

  const number = (field, label, { required, hint, step = '1' } = {}) => (
    <FormField label={label} htmlFor={field} error={errors[field]?.message} hint={hint} required={required}>
      <input id={field} type="number" inputMode="numeric" min="0" step={step} aria-invalid={Boolean(errors[field])} className={inputClass(errors[field])} {...register(field)} />
    </FormField>
  )

  const flag = (field, label) => <Controller control={control} name={field} render={({ field: f }) => <Toggle checked={f.value} onChange={f.onChange} ariaLabel={label} />} />

  const slugField = register('slug')

  return (
    <form onSubmit={handleSubmit(onSubmit, onInvalid)} noValidate className="flex flex-col gap-5">
      <BackLink title={isEdit ? product.name : 'New product'} />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div className="flex min-w-0 flex-col gap-4">
          <Card title="Basic information">
            {text('name', 'Product name', { required: true, placeholder: 'e.g. Hoco W35 Wireless Headphones' })}
            <FormField label="URL slug" htmlFor="slug" error={errors.slug?.message} hint={isEdit ? 'Changing the slug changes the product link.' : 'Filled in from the name. You can edit it.'}>
              <div className={cn(inputClass(errors.slug), 'flex items-center gap-0 p-0 focus-within:border-primary')}>
                <span className="pl-3.5 text-body whitespace-nowrap text-text-faint">/product/</span>
                <input
                  id="slug"
                  className="h-full min-w-0 flex-1 bg-transparent pr-3.5 outline-none"
                  {...slugField}
                  onChange={(e) => {
                    slugEdited.current = true
                    slugField.onChange(e)
                  }}
                  onBlur={(e) => {
                    setValue('slug', slugify(e.target.value), { shouldDirty: true })
                    slugField.onBlur(e)
                  }}
                />
              </div>
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              {text('code', 'Product code', { placeholder: 'Auto, e.g. TS-HP-035', hint: isEdit ? 'Must be unique.' : 'Leave empty to generate it from the category.' })}
              {text('brand', 'Brand', { placeholder: 'e.g. Hoco' })}
            </div>
            {text('shortDescription', 'Short description', { multiline: true, rows: 2, placeholder: 'One line shown near the price' })}
            {text('description', 'Description', { multiline: true, rows: 6, placeholder: 'Full details shown in the Description tab' })}
          </Card>

          <Card title="Images" aside={<span className="text-body-sm text-text-muted max-sm:hidden">The first image is the main photo.</span>}>
            <Controller control={control} name="images" render={({ field }) => <ImageUploader value={field.value} onChange={onImagesChange} />} />
            {errors.images && <p role="alert" className="text-body-sm font-medium text-error">{errors.images.message}</p>}
          </Card>

          <Card title="Pricing and stock">
            <div className="grid gap-4 sm:grid-cols-3">
              {number('price', 'Price (৳)', { required: true })}
              {number('oldPrice', 'Old price (৳)', { hint: 'Shown crossed out' })}
              {number('stock', 'Stock', { required: true })}
            </div>
            <StockQuickAdjust saved={isEdit ? (product.stock ?? 0) : null} value={stock} onChange={(n) => setValue('stock', String(n), { shouldDirty: true, shouldValidate: true })} />
          </Card>

          <Card
            title="Variants"
            aside={
              <Button variant="secondary" Icon={Plus} onClick={() => variants.append({ name: '', options: '', images: {} })}>
                Add variant
              </Button>
            }
          >
            {variants.fields.length === 0 && <p className="text-body text-text-muted">No variants. Add one for choices like Color: Black, White.</p>}
            {variants.fields.map((row, i) => (
              <div key={row.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 sm:grid-cols-[180px_minmax(0,1fr)_auto]">
                <FormField error={errors.variants?.[i]?.name?.message} className="max-sm:col-span-2">
                  <input aria-label={`Variant ${i + 1} name`} placeholder="Color" className={inputClass(errors.variants?.[i]?.name)} {...register(`variants.${i}.name`)} />
                </FormField>
                <FormField error={errors.variants?.[i]?.options?.message} hint="Separate options with commas">
                  <input aria-label={`Variant ${i + 1} options`} placeholder="Black, White, Blue" className={inputClass(errors.variants?.[i]?.options)} {...register(`variants.${i}.options`)} />
                </FormField>
                <button type="button" onClick={() => variants.remove(i)} aria-label={`Remove variant ${i + 1}`} className={rowButton}>
                  <Trash2 size={17} />
                </button>
                <OptionPictures index={i} control={control} getValues={getValues} setValue={setValue} />
              </div>
            ))}
          </Card>

          <Card
            title="Specifications"
            aside={
              <Button variant="secondary" Icon={Plus} onClick={() => specs.append({ label: '', value: '' })}>
                Add row
              </Button>
            }
          >
            {specs.fields.length === 0 && <p className="text-body text-text-muted">No specifications yet.</p>}
            {specs.fields.map((row, i) => (
              <div key={row.id} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_auto] gap-2">
                <FormField error={errors.specs?.[i]?.label?.message}>
                  <input aria-label={`Spec ${i + 1} label`} placeholder="Bluetooth" className={inputClass(errors.specs?.[i]?.label)} {...register(`specs.${i}.label`)} />
                </FormField>
                <input aria-label={`Spec ${i + 1} value`} placeholder="5.3" className={inputClass()} {...register(`specs.${i}.value`)} />
                <button type="button" onClick={() => specs.remove(i)} aria-label={`Remove spec ${i + 1}`} className={rowButton}>
                  <Trash2 size={17} />
                </button>
              </div>
            ))}
          </Card>
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <Card title="Publish">
            <FlagRow label="Published" hint="Turn off to save as a draft">
              {flag('published', 'Published')}
            </FlagRow>
            {isEdit && (
              <p className="flex justify-between gap-3 text-body-sm text-text-muted">
                Last updated <span className="font-semibold text-text">{formatDate(product.updatedAt ?? product.createdAt, { withTime: true })}</span>
              </p>
            )}
          </Card>

          <Card title="Category">
            <FormField label="Category" htmlFor="categoryId" required error={errors.categoryId?.message}>
              <Select id="categoryId" error={errors.categoryId} className="[&_select]:h-12 [&_select]:rounded-[10px] [&_select]:text-body" {...register('categoryId')}>
                <option value="">Choose a category</option>
                <CategoryOptions tree={tree} leafOnly current={initial.categoryId} />
              </Select>
            </FormField>
            {categoriesFailed && (
              <button type="button" onClick={() => refetchCategories()} className="self-start text-body-sm font-semibold text-primary">
                Could not load categories. Retry
              </button>
            )}
          </Card>

          <Card title="Delivery and flags">
            <FlagRow label="Free delivery" hint="This product ships free. A Free Delivery badge shows on the card and page.">
              {flag('freeDelivery', 'Free delivery')}
            </FlagRow>
            <FlagRow label="New arrival" hint="Shows the New badge and sorts it first">
              {flag('isNew', 'New arrival')}
            </FlagRow>
          </Card>

          <Card title="Social proof">
            <p className="-mt-2 text-body-sm text-text-muted">These are shown on the storefront as you enter them. A later version will use real review and order numbers.</p>
            <FlagRow label="Use real review numbers" hint="Rating and review count follow approved reviews.">
              {flag('autoRating', 'Use real review numbers')}
            </FlagRow>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Rating (0 to 5)" htmlFor="rating" error={errors.rating?.message}>
                <input id="rating" type="number" inputMode="decimal" min="0" max="5" step="0.1" readOnly={autoRating} aria-invalid={Boolean(errors.rating)} className={cn(inputClass(errors.rating), autoRating && 'bg-fill-soft text-text-muted')} {...register('rating')} />
              </FormField>
              <FormField label="Review count" htmlFor="reviewCount" error={errors.reviewCount?.message}>
                <input id="reviewCount" type="number" inputMode="numeric" min="0" step="1" readOnly={autoRating} aria-invalid={Boolean(errors.reviewCount)} className={cn(inputClass(errors.reviewCount), autoRating && 'bg-fill-soft text-text-muted')} {...register('reviewCount')} />
              </FormField>
            </div>
            {number('soldCount', 'Sold count', { hint: 'Shown as "120+ sold". The rating shows once there are 3 or more reviews.' })}
          </Card>

          <Card title="Collections">
            <p className="-mt-2 text-body-sm text-text-muted">Choose where this product appears on the store.</p>
            <Controller
              control={control}
              name="collections"
              render={({ field }) => (
                <div className="flex flex-col gap-2.5">
                  {collectionOptions.length === 0 && <p className="text-body-sm text-text-muted">No collections found in the products yet.</p>}
                  {collectionOptions.map((c) => (
                    <label key={c} className="flex cursor-pointer items-center gap-2.5 text-[13px] text-text-secondary">
                      <input
                        type="checkbox"
                        checked={field.value.includes(c)}
                        onChange={(e) => field.onChange(e.target.checked ? [...field.value, c] : field.value.filter((x) => x !== c))}
                        className="size-4 accent-primary"
                      />
                      {labelFromSlug(c)}
                    </label>
                  ))}
                </div>
              )}
            />
          </Card>
        </div>
      </div>

      <div className="sticky bottom-0 z-20 -mx-4 -mb-10 flex items-center justify-end gap-2.5 border-t border-border bg-white px-4 py-3 lg:-mx-7 lg:px-7">
        <p className="mr-auto text-body-sm text-text-muted max-sm:hidden">{isDirty ? 'You have unsaved changes' : isEdit ? 'No changes yet' : 'Fill in the details and save'}</p>
        <Button variant="secondary" onClick={() => guard.request('/admin/products')} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" Icon={Save} loading={saving}>
          {isEdit ? 'Save changes' : 'Save product'}
        </Button>
      </div>

      <ConfirmDialog
        open={Boolean(guard.pending)}
        onClose={guard.cancel}
        onConfirm={guard.confirm}
        danger
        title="Leave without saving?"
        message="Your changes to this product will be lost."
        confirmLabel="Leave page"
        cancelLabel="Keep editing"
      />
    </form>
  )
}
