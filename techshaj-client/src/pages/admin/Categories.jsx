import { FolderTree, Pencil, Plus, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import CategoryIcon from '../../components/CategoryIcon.jsx'
import { Skeleton } from '../../components/Skeleton.jsx'
import Button from '../../components/admin/Button.jsx'
import ConfirmDialog from '../../components/admin/ConfirmDialog.jsx'
import EmptyState from '../../components/admin/EmptyState.jsx'
import ErrorState from '../../components/admin/ErrorState.jsx'
import FormField from '../../components/admin/FormField.jsx'
import Modal from '../../components/admin/Modal.jsx'
import PageHeader from '../../components/admin/PageHeader.jsx'
import Select from '../../components/admin/Select.jsx'
import { inputClass } from '../../components/admin/inputClass.js'
import { toTree, useAdminCategories, useDeleteCategory, useSaveCategory } from '../../hooks/useAdminCategories.js'
import { useAllAdminProducts } from '../../hooks/useAdminProducts.js'
import { cn } from '../../lib/cn.js'
import { notify } from '../../lib/notify.jsx'
import { errorMessage } from '../../lib/query.js'
import { slugify } from '../../lib/slug.js'
import { zodResolver } from '../../lib/zodResolver.js'

const schema = z.object({
  name: z.string().trim().min(1, 'Enter the category name'),
  slug: z.string().trim().min(1, 'Enter a slug'),
  parentId: z.string(),
  code: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9]{0,4}$/, 'Use 1 to 4 letters or digits'),
})

const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`

// "This category still has 12 products and 2 subcategories. Move or delete them first."
function blockedMessage({ productCount = 0, subcategoryCount = 0 }) {
  const parts = [productCount && plural(productCount, 'product'), subcategoryCount && plural(subcategoryCount, 'subcategory', 'subcategories')].filter(Boolean)
  return `This category still has ${parts.join(' and ')}. Move or delete them first.`
}

function CategoryModal({ open, category, parents, onClose }) {
  const isEdit = Boolean(category?.id)
  const save = useSaveCategory()
  const defaults = {
    name: category?.name ?? '',
    slug: category?.slug ?? '',
    parentId: category?.parentId ? String(category.parentId) : '',
    code: category?.code ?? '',
  }
  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema), defaultValues: defaults })

  const slugEdited = useRef(isEdit)
  const name = useWatch({ control, name: 'name' })
  useEffect(() => {
    if (!slugEdited.current) setValue('slug', slugify(name))
  }, [name, setValue])

  const hasChildren = category?.children?.length > 0
  const slugField = register('slug')

  const onSubmit = (values) => {
    const data = {
      name: values.name.trim(),
      slug: slugify(values.slug),
      parentId: values.parentId ? Number(values.parentId) : null,
      ...(values.code.trim() && { code: values.code.trim().toUpperCase() }),
    }
    const body = isEdit ? Object.fromEntries(Object.entries(data).filter(([k, v]) => v !== (k === 'code' ? (category.code ?? '') : (category[k] ?? null)))) : data
    if (isEdit && !Object.keys(body).length) {
      onClose()
      return
    }
    save.mutate(
      { id: category?.id, data: body },
      {
        onSuccess: (c) => {
          notify.success(isEdit ? 'Category saved' : 'Category added', { description: c.name })
          onClose()
        },
        onError: (error) => notify.error(isEdit ? 'Could not save category' : 'Could not add category', { description: errorMessage(error) }),
      },
    )
  }

  return (
    <Modal
      open={open}
      onClose={save.isPending ? () => {} : onClose}
      title={isEdit ? 'Edit category' : 'Add category'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={save.isPending}>
            Cancel
          </Button>
          <Button type="submit" form="category-form" loading={save.isPending}>
            {isEdit ? 'Save changes' : 'Add category'}
          </Button>
        </>
      }
    >
      <form id="category-form" onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <FormField label="Category name" htmlFor="cat-name" required error={errors.name?.message}>
          <input id="cat-name" autoFocus placeholder="e.g. Earbuds" aria-invalid={Boolean(errors.name)} className={inputClass(errors.name)} {...register('name')} />
        </FormField>
        <FormField label="URL slug" htmlFor="cat-slug" error={errors.slug?.message} hint={isEdit ? 'Changing the slug changes the category link.' : 'Filled in from the name. You can edit it.'}>
          <div className={cn(inputClass(errors.slug), 'flex items-center p-0 focus-within:border-primary')}>
            <span className="pl-3.5 text-body whitespace-nowrap text-text-faint">/category/</span>
            <input
              id="cat-slug"
              className="h-full min-w-0 flex-1 bg-transparent pr-3.5 outline-none"
              {...slugField}
              onChange={(e) => {
                slugEdited.current = true
                slugField.onChange(e)
              }}
              onBlur={(e) => {
                setValue('slug', slugify(e.target.value))
                slugField.onBlur(e)
              }}
            />
          </div>
        </FormField>
        <FormField
          label="Parent category"
          htmlFor="cat-parent"
          hint={hasChildren ? 'This category has subcategories, so it stays at the top level.' : 'Categories go two levels deep: a subcategory cannot have its own subcategories.'}
        >
          {hasChildren ? (
            <p id="cat-parent" className={cn(inputClass(), 'flex items-center bg-fill-soft text-text-muted')}>
              None (top level)
            </p>
          ) : (
            <Select id="cat-parent" className="[&_select]:h-12 [&_select]:rounded-[10px] [&_select]:text-body" {...register('parentId')}>
              <option value="">None (top level)</option>
              {parents
                .filter((p) => p.id !== category?.id)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </Select>
          )}
        </FormField>
        <FormField label="Short code" htmlFor="cat-code" error={errors.code?.message} hint="Optional, 1 to 4 letters or digits. Used in new product codes, e.g. TS-EB-001.">
          <input id="cat-code" maxLength={4} placeholder="EB" aria-invalid={Boolean(errors.code)} className={cn(inputClass(errors.code), 'uppercase')} {...register('code')} />
        </FormField>
      </form>
    </Modal>
  )
}

function Row({ category, count, child, onEdit, onDelete }) {
  return (
    <li className={cn('flex items-center gap-3 border-b border-row-line px-4 py-3 last:border-b-0', child ? 'pl-10 lg:pl-14' : 'bg-white')}>
      <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-lg', child ? 'bg-fill-soft text-text-muted' : 'bg-fill text-text')}>
        <CategoryIcon name={category.icon} size={17} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className={cn('truncate text-[13px] text-text', child ? 'font-medium' : 'font-bold')}>
          {category.name}
          {category.code && <span className="ml-2 rounded bg-fill px-1.5 py-0.5 text-[10px] font-bold text-text-muted">{category.code}</span>}
        </span>
        <span className="truncate text-[11px] text-text-faint">/category/{category.slug}</span>
      </div>
      <span className="w-20 shrink-0 text-right text-[13px] text-text-secondary sm:w-24">{count == null ? <Skeleton className="ml-auto h-3.5 w-10" /> : plural(count, 'product')}</span>
      <div className="flex shrink-0 gap-1.5">
        <button type="button" onClick={onEdit} aria-label={`Edit ${category.name}`} className="flex size-8 items-center justify-center rounded-lg border border-border-strong text-text hover:border-text-faint">
          <Pencil size={15} />
        </button>
        <button type="button" onClick={onDelete} aria-label={`Delete ${category.name}`} className="flex size-8 items-center justify-center rounded-lg border border-border-strong text-error hover:border-error">
          <Trash2 size={15} />
        </button>
      </div>
    </li>
  )
}

// Figma "Admin – Categories" (60:8592).
export default function Categories() {
  const { data: categories, isLoading, isError, refetch } = useAdminCategories()
  const { data: products } = useAllAdminProducts()
  const tree = useMemo(() => toTree(categories), [categories])
  const remove = useDeleteCategory()
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [blocked, setBlocked] = useState(null)

  // Counts include drafts, the same rule the server uses before a delete.
  const counts = useMemo(() => {
    if (!products) return null
    const own = {}
    for (const p of products) own[p.categoryId] = (own[p.categoryId] ?? 0) + 1
    return Object.fromEntries(tree.flatMap((p) => [[p.id, (own[p.id] ?? 0) + p.children.reduce((sum, c) => sum + (own[c.id] ?? 0), 0)], ...p.children.map((c) => [c.id, own[c.id] ?? 0])]))
  }, [products, tree])

  const confirmDelete = () =>
    remove.mutate(deleting.id, {
      onSuccess: () => {
        notify.success('Category deleted', { description: deleting.name })
        setDeleting(null)
      },
      onError: (error) => {
        const data = error.response?.data
        if (error.response?.status === 400 && (data?.productCount || data?.subcategoryCount)) setBlocked({ name: deleting.name, message: blockedMessage(data) })
        else notify.error('Could not delete category', { description: errorMessage(error) })
        setDeleting(null)
      },
    })

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Categories"
        subtitle={categories ? `${tree.length} top level, ${categories.length - tree.length} subcategories` : 'Two levels: categories and their subcategories'}
        action={{ label: 'Add category', Icon: Plus, onClick: () => setEditing({}) }}
      />

      <div className="overflow-hidden rounded-xl border border-border bg-white">
        <div className="flex items-center gap-3 border-b border-border bg-fill-soft px-4 py-3 text-[11px] font-semibold text-text-muted">
          <span className="flex-1">CATEGORY</span>
          <span className="w-20 text-right sm:w-24">PRODUCTS</span>
          <span className="w-[70px]" />
        </div>
        {isError ? (
          <ErrorState onRetry={refetch} />
        ) : isLoading ? (
          <div role="status" aria-label="Loading">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className={cn('flex items-center gap-3 border-b border-row-line px-4 py-3', i % 3 && 'pl-14')}>
                <Skeleton className="size-9 rounded-lg" />
                <Skeleton className="h-4 flex-1 max-w-[220px]" />
              </div>
            ))}
          </div>
        ) : tree.length === 0 ? (
          <EmptyState Icon={FolderTree} title="No categories yet" text="Add a category to start organising products." action={{ label: 'Add category', Icon: Plus, onClick: () => setEditing({}) }} />
        ) : (
          <ul>
            {tree.map((parent) => (
              <li key={parent.id}>
                <ul>
                  <Row category={parent} count={counts?.[parent.id]} onEdit={() => setEditing(parent)} onDelete={() => setDeleting(parent)} />
                  {parent.children.map((child) => (
                    <Row key={child.id} child category={child} count={counts?.[child.id]} onEdit={() => setEditing(child)} onDelete={() => setDeleting(child)} />
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </div>

      {editing && <CategoryModal open category={editing.id ? editing : null} parents={tree} onClose={() => setEditing(null)} />}

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        loading={remove.isPending}
        danger
        title="Delete category?"
        message={deleting && `"${deleting.name}" will be deleted. A category that still has products or subcategories cannot be deleted.`}
        confirmLabel="Delete"
      />

      <ConfirmDialog
        open={Boolean(blocked)}
        onClose={() => setBlocked(null)}
        onConfirm={() => setBlocked(null)}
        title={`Cannot delete ${blocked?.name ?? 'category'}`}
        message={blocked?.message}
        confirmLabel="OK"
        cancelLabel="Close"
      />
    </div>
  )
}
