import { ChevronLeft, PackageX, Plus, Save, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useRef } from 'react'
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form'
import { Link, useLocation, useParams } from 'react-router-dom'
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
import Toggle from '../../components/admin/Toggle.jsx'
import { inputClass } from '../../components/admin/inputClass.js'
import { toTree, useAdminCategories } from '../../hooks/useAdminCategories.js'
import { useAdminProduct, useAllAdminProducts, useCreateProduct, useUpdateProduct } from '../../hooks/useAdminProducts.js'
import { useLeaveGuard } from '../../hooks/useLeaveGuard.js'
import { formatDate } from '../../lib/adminFormat.js'
import { cn } from '../../lib/cn.js'
import { notify } from '../../lib/notify.jsx'
import { errorMessage, isNotFound } from '../../lib/query.js'
import { labelFromSlug, slugify } from '../../lib/slug.js'
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
    published: z.boolean(),
    collections: z.array(z.string()),
    images: z.array(z.string()).min(1, 'Add at least 1 image'),
    variants: z.array(z.object({ name: z.string(), options: z.string() })),
    specs: z.array(z.object({ label: z.string(), value: z.string() })),
  })
  .superRefine((v, ctx) => {
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
  published: p.published !== false,
  collections: p.collections ?? [],
  images: p.images ?? [],
  variants: (p.variants ?? []).map((v) => ({ name: v.name, options: v.options.join(', ') })),
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
  published: v.published,
  collections: v.collections,
  images: v.images,
  variants: v.variants.filter((r) => r.name.trim()).map((r) => ({ name: r.name.trim(), options: splitOptions(r.options) })),
  specs: v.specs.filter((r) => r.label.trim()).map((r) => ({ label: r.label.trim(), value: r.value.trim() })),
})

const changedFields = (next, base) => Object.fromEntries(Object.entries(next).filter(([k, v]) => JSON.stringify(v) !== JSON.stringify(base[k])))

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
            <Controller control={control} name="images" render={({ field }) => <ImageUploader value={field.value} onChange={(urls) => setValue('images', urls, { shouldDirty: true, shouldValidate: Boolean(errors.images) })} />} />
            {errors.images && <p role="alert" className="text-body-sm font-medium text-error">{errors.images.message}</p>}
          </Card>

          <Card title="Pricing and stock">
            <div className="grid gap-4 sm:grid-cols-3">
              {number('price', 'Price (৳)', { required: true })}
              {number('oldPrice', 'Old price (৳)', { hint: 'Shown crossed out' })}
              {number('stock', 'Stock', { required: true })}
            </div>
          </Card>

          <Card
            title="Variants"
            aside={
              <Button variant="secondary" Icon={Plus} onClick={() => variants.append({ name: '', options: '' })}>
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
                <CategoryOptions tree={tree} />
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
