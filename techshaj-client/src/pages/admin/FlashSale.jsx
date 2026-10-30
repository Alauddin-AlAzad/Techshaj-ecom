import { Check, ImageOff, Info, Plus, Save, Search, X, Zap } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { Skeleton } from '../../components/Skeleton.jsx'
import Button from '../../components/admin/Button.jsx'
import Card from '../../components/admin/Card.jsx'
import ConfirmDialog from '../../components/admin/ConfirmDialog.jsx'
import ErrorState from '../../components/admin/ErrorState.jsx'
import FormField from '../../components/admin/FormField.jsx'
import PageHeader from '../../components/admin/PageHeader.jsx'
import Spinner from '../../components/admin/Spinner.jsx'
import Toggle from '../../components/admin/Toggle.jsx'
import { inputClass } from '../../components/admin/inputClass.js'
import { useCurrentFlashSale, useSaveFlashSale } from '../../hooks/useAdminFlashSale.js'
import { useAdminProductSearch } from '../../hooks/useAdminProducts.js'
import { useLeaveGuard } from '../../hooks/useLeaveGuard.js'
import { formatPrice, fromDhakaInput, toDhakaInput } from '../../lib/adminFormat.js'
import { cn } from '../../lib/cn.js'
import { notify } from '../../lib/notify.jsx'
import { errorMessage } from '../../lib/query.js'
import { zodResolver } from '../../lib/zodResolver.js'

const productSchema = z.object({ id: z.number(), name: z.string(), price: z.number().nullable(), image: z.string().nullable() })

// A new sale needs everything; an existing one can be saved with any of its fields changed.
const schemaFor = (isNew) =>
  z
    .object({
      title: z.string().trim().min(1, 'Enter a title').max(80, 'Keep the title under 80 characters'),
      endsAt: z.string().min(1, 'Choose when the sale ends'),
      active: z.boolean(),
      products: isNew ? z.array(productSchema).min(1, 'Add at least one product') : z.array(productSchema),
    })
    .refine((v) => !v.active || !v.endsAt || new Date(fromDhakaInput(v.endsAt)) > new Date(), { path: ['endsAt'], message: 'Pick a time in the future, or turn the sale off' })

const toChip = (p) => ({ id: p.id, name: p.name, price: p.price ?? null, image: p.images?.[0] ?? null })

const toFormValues = (sale) => ({
  title: sale?.title ?? 'Flash Sale',
  endsAt: toDhakaInput(sale?.endsAt),
  active: sale ? sale.active !== false : true,
  // Unpublished products are not returned by /offers, so they show by id only.
  products: (sale?.productIds ?? []).map((id) => {
    const p = sale.products?.find((x) => x.id === id)
    return p ? toChip(p) : { id, name: `Product #${id} (hidden from the store)`, price: null, image: null }
  }),
})

const toPayload = (v) => ({
  title: v.title.trim(),
  endsAt: fromDhakaInput(v.endsAt),
  active: v.active,
  productIds: v.products.map((p) => p.id),
})

function Thumb({ src, className }) {
  const [failed, setFailed] = useState(false)
  return (
    <span className={cn('flex shrink-0 items-center justify-center overflow-hidden rounded-md bg-fill text-text-faint', className)}>
      {src && !failed ? <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} className="size-full object-cover" /> : <ImageOff size={14} />}
    </span>
  )
}

function ProductPicker({ selected, onAdd }) {
  const [search, setSearch] = useState('')
  const { data: results = [], isFetching, isError } = useAdminProductSearch(search)
  const chosen = new Set(selected.map((p) => p.id))
  const term = search.trim()

  return (
    <div className="relative">
      <div className="flex h-11 items-center gap-2 rounded-[10px] border border-border-strong bg-white px-3.5 focus-within:border-primary">
        <Search size={16} className="shrink-0 text-text-faint" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products by name or code to add them"
          aria-label="Search products to add"
          className="min-w-0 flex-1 bg-transparent text-body text-text outline-none placeholder:text-text-faint [&::-webkit-search-cancel-button]:hidden"
        />
        {isFetching && <Spinner size={16} />}
        {search && (
          <button type="button" onClick={() => setSearch('')} aria-label="Clear search" className="text-text-faint hover:text-text">
            <X size={14} />
          </button>
        )}
      </div>
      {term && (
        <ul className="absolute inset-x-0 top-full z-20 mt-1.5 max-h-[320px] overflow-y-auto rounded-xl border border-border bg-white p-1.5 shadow-menu">
          {isError ? (
            <li className="px-3 py-4 text-center text-body-sm text-error">Could not search products. Try again.</li>
          ) : results.length === 0 ? (
            <li className="px-3 py-4 text-center text-body-sm text-text-muted">{isFetching ? 'Searching…' : `No products match "${term}"`}</li>
          ) : (
            results.map((p) => {
              const added = chosen.has(p.id)
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    disabled={added}
                    onClick={() => onAdd(toChip(p))}
                    className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-fill-soft disabled:cursor-default disabled:hover:bg-transparent"
                  >
                    <Thumb src={p.images?.[0]} className="size-9" />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-[13px] font-semibold text-text">{p.name}</span>
                      <span className="text-[11px] text-text-faint">
                        {p.code} · {formatPrice(p.price)}
                        {p.published === false && ' · Draft'}
                      </span>
                    </span>
                    {added ? (
                      <span className="flex items-center gap-1 text-[12px] font-semibold text-success">
                        <Check size={14} />
                        Added
                      </span>
                    ) : (
                      <Plus size={16} className="text-primary" />
                    )}
                  </button>
                </li>
              )
            })
          )}
        </ul>
      )}
    </div>
  )
}

function SaleStatus({ sale }) {
  if (!sale) return <span className="rounded-[10px] bg-fill px-2 py-[3px] text-label-sm text-text-muted">Not created</span>
  return (
    <span className="flex items-center gap-1.5 rounded-[10px] bg-success-tint px-2 py-[3px] text-label-sm text-success">
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      Live
    </span>
  )
}

function FlashSaleEditor({ sale }) {
  const isNew = !sale
  const initial = useMemo(() => toFormValues(sale), [sale])
  const schema = useMemo(() => schemaFor(isNew), [isNew])
  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm({ resolver: zodResolver(schema), defaultValues: initial })
  const products = useWatch({ control, name: 'products' })
  const save = useSaveFlashSale()
  const guard = useLeaveGuard(isDirty && !save.isPending)

  const setProducts = (list) => setValue('products', list, { shouldDirty: true, shouldValidate: Boolean(errors.products) })

  const onSubmit = (values) => {
    const payload = toPayload(values)
    const before = toPayload(initial)
    const data = isNew ? payload : Object.fromEntries(Object.entries(payload).filter(([k, v]) => JSON.stringify(v) !== JSON.stringify(before[k])))
    if (!Object.keys(data).length) {
      notify.info('No changes to save')
      return
    }
    save.mutate(data, {
      onSuccess: () => {
        notify.success(isNew ? 'Flash sale created' : 'Flash sale saved', { description: values.title.trim() })
        reset(values)
      },
      onError: (error) => notify.error('Could not save the flash sale', { description: errorMessage(error) }),
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit, () => notify.error('Please fix the highlighted fields'))} noValidate className="flex flex-col gap-5">
      <PageHeader title="Flash Sale" subtitle="Countdown section on the homepage. It hides on its own when the timer ends.">
        <Button type="submit" Icon={Save} loading={save.isPending}>
          {isNew ? 'Create flash sale' : 'Save changes'}
        </Button>
      </PageHeader>

      {isNew && (
        <p className="flex items-start gap-2.5 rounded-xl border border-highlight-line bg-highlight-tint p-3.5 text-[13px] text-highlight-ink">
          <Info size={16} className="mt-px shrink-0" />
          <span>
            No flash sale is running right now. Saving creates one, so a title, an end time and at least one product are required. If an older sale is paused or has ended, saving updates that one instead.
          </span>
        </p>
      )}

      <Card
        title={
          <span className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-[10px] bg-secondary text-white">
              <Zap size={18} />
            </span>
            Flash Sale
          </span>
        }
        aside={
          <div className="flex items-center gap-3">
            <SaleStatus sale={sale} />
            <Controller control={control} name="active" render={({ field }) => <Toggle checked={field.value} onChange={field.onChange} ariaLabel="Flash sale is on" />} />
          </div>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Section title" htmlFor="sale-title" required error={errors.title?.message}>
            <input id="sale-title" placeholder="Flash Sale" aria-invalid={Boolean(errors.title)} className={inputClass(errors.title)} {...register('title')} />
          </FormField>
          <FormField label="Ends" htmlFor="sale-ends" required error={errors.endsAt?.message} hint="Dhaka time. The countdown runs to this moment.">
            <input id="sale-ends" type="datetime-local" aria-invalid={Boolean(errors.endsAt)} className={inputClass(errors.endsAt)} {...register('endsAt')} />
          </FormField>
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="text-[14px] font-bold text-text">Products in flash sale ({products.length})</h3>
          <ProductPicker selected={products} onAdd={(p) => setProducts([...products, p])} />
          {errors.products && (
            <p role="alert" className="text-body-sm font-medium text-error">
              {errors.products.message}
            </p>
          )}
          {products.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border-strong py-8 text-center text-body text-text-muted">Search above to add products.</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {products.map((p) => (
                <li key={p.id} className="flex max-w-full items-center gap-2 rounded-[10px] border border-border-strong bg-white py-1.5 pr-1.5 pl-1.5">
                  <Thumb src={p.image} className="size-8" />
                  <span className="flex min-w-0 flex-col">
                    <span className="max-w-[220px] truncate text-[13px] font-semibold text-text">{p.name}</span>
                    {p.price != null && <span className="text-[11px] font-semibold text-text-muted">{formatPrice(p.price)}</span>}
                  </span>
                  <button
                    type="button"
                    onClick={() => setProducts(products.filter((x) => x.id !== p.id))}
                    aria-label={`Remove ${p.name}`}
                    className="flex size-7 shrink-0 items-center justify-center rounded-md text-text-faint hover:bg-error-tint hover:text-error"
                  >
                    <X size={15} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>

      <ConfirmDialog
        open={Boolean(guard.pending)}
        onClose={guard.cancel}
        onConfirm={guard.confirm}
        danger
        title="Leave without saving?"
        message="Your changes to the flash sale will be lost."
        confirmLabel="Leave"
        cancelLabel="Keep editing"
      />
    </form>
  )
}

// Figma "Collections & Flash Sale" (60:9367), flash sale part.
export default function FlashSale() {
  const { data: sale, isLoading, isError, refetch } = useCurrentFlashSale()

  if (isLoading) {
    return (
      <div role="status" aria-label="Loading" className="flex flex-col gap-5">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[360px] rounded-xl" />
      </div>
    )
  }
  if (isError) {
    return (
      <div className="flex flex-col gap-5">
        <PageHeader title="Flash Sale" />
        <div className="rounded-xl border border-border bg-white">
          <ErrorState title="Could not load the flash sale" onRetry={refetch} />
        </div>
      </div>
    )
  }
  return <FlashSaleEditor key={sale ? `${sale._id}-${sale.updatedAt}` : 'new'} sale={sale} />
}
