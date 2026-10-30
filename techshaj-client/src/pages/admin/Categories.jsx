import { ArrowDown, ArrowUp, ChevronDown, FolderTree, Pencil, Plus, Trash2, TriangleAlert } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import CategoryIcon from '../../components/CategoryIcon.jsx'
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
import Toggle from '../../components/admin/Toggle.jsx'
import { inputClass } from '../../components/admin/inputClass.js'
import { toTree, useAdminCategories, useDeleteCategory, useReorderCategories, useSaveCategory } from '../../hooks/useAdminCategories.js'
import { ICON_NAMES } from '../../lib/categoryIcons.js'
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
  menuName: z.string(),
  icon: z.string(),
  image: z.string(),
  active: z.boolean(),
})

const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`
const selectClass = '[&_select]:h-12 [&_select]:rounded-[10px] [&_select]:text-body'

// "This category still has 12 products and 2 subcategories. Move or delete them first."
function blockedMessage({ productCount = 0, subcategoryCount = 0 }) {
  const parts = [productCount && plural(productCount, 'product'), subcategoryCount && plural(subcategoryCount, 'subcategory', 'subcategories')].filter(Boolean)
  return `This category still has ${parts.join(' and ')}. Move or delete them first.`
}

// category: the one being edited, or null to add. lockedParent: "+ Subcategory" fixes the parent.
function CategoryModal({ category, lockedParent, parents, onClose }) {
  const isEdit = Boolean(category)
  const save = useSaveCategory()
  const defaults = {
    name: category?.name ?? '',
    slug: category?.slug ?? '',
    parentId: lockedParent ? String(lockedParent.id) : category?.parentId ? String(category.parentId) : '',
    code: category?.code ?? '',
    menuName: category?.menuName ?? '',
    icon: category?.icon ?? 'Package',
    image: category?.image ?? '',
    active: category?.active !== false,
  }
  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema), defaultValues: defaults })

  const slugEdited = useRef(isEdit)
  const [name, icon, image, parentId] = useWatch({ control, name: ['name', 'icon', 'image', 'parentId'] })
  useEffect(() => {
    if (!slugEdited.current) setValue('slug', slugify(name))
  }, [name, setValue])

  const hasChildren = category?.children?.length > 0
  const slugField = register('slug')
  const isSub = Boolean(parentId)
  const title = isEdit ? (category.parentId ? 'Edit subcategory' : 'Edit category') : lockedParent ? `Add subcategory to ${lockedParent.name}` : 'Add category'

  const onSubmit = (values) => {
    const data = {
      name: values.name.trim(),
      slug: slugify(values.slug),
      parentId: values.parentId ? Number(values.parentId) : null,
      code: values.code.trim().toUpperCase(),
      menuName: values.menuName.trim(),
      icon: values.icon,
      image: values.image,
      active: values.active,
    }
    let body = data
    if (isEdit) {
      const base = { ...defaults, parentId: category.parentId ?? null, code: category.code ?? '', menuName: category.menuName ?? '' }
      body = Object.fromEntries(Object.entries(data).filter(([k, v]) => v !== base[k]))
      if (!Object.keys(body).length) return onClose()
    } else {
      if (!body.code) delete body.code
      if (!body.menuName) delete body.menuName
    }
    // The server keeps code as 1 to 4 characters; clearing it is not supported.
    if (isEdit && body.code === '') delete body.code
    save.mutate(
      { id: category?.id, data: body },
      {
        onSuccess: (c) => {
          notify.success(isEdit ? 'Category saved' : c.parentId ? 'Subcategory added' : 'Category added', { description: c.name })
          onClose()
        },
        onError: (error) => notify.error(isEdit ? 'Could not save category' : 'Could not add category', { description: errorMessage(error) }),
      },
    )
  }

  return (
    <Modal
      open
      onClose={save.isPending ? () => {} : onClose}
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={save.isPending}>
            Cancel
          </Button>
          <Button type="submit" form="category-form" loading={save.isPending}>
            {isEdit ? 'Save changes' : isSub ? 'Add subcategory' : 'Add category'}
          </Button>
        </>
      }
    >
      <form id="category-form" onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        {save.isError && (
          <p role="alert" className="flex items-start gap-2 rounded-[10px] border border-error-line bg-error-wash px-3.5 py-3 text-body-sm font-medium text-error">
            <TriangleAlert size={15} className="mt-px shrink-0" />
            {errorMessage(save.error)}
          </p>
        )}
        <FormField label="Name" htmlFor="cat-name" required error={errors.name?.message}>
          <input id="cat-name" autoFocus placeholder={isSub ? 'e.g. Earbuds' : 'e.g. Audio'} aria-invalid={Boolean(errors.name)} className={inputClass(errors.name)} {...register('name')} />
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
          hint={
            lockedParent
              ? 'This subcategory is added under the category you picked.'
              : hasChildren
                ? 'This category has subcategories, so it stays at the top level.'
                : 'Categories go two levels deep: a subcategory cannot have its own subcategories.'
          }
        >
          {lockedParent || hasChildren ? (
            <p id="cat-parent" className={cn(inputClass(), 'flex items-center bg-fill-soft text-text-muted')}>
              {lockedParent ? lockedParent.name : 'None (top level)'}
            </p>
          ) : (
            <Select id="cat-parent" className={selectClass} {...register('parentId')}>
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
        <FormField label="Picture" hint="Square image, shown on the categories page, menus and Home. Without a picture the icon is shown.">
          <Controller
            control={control}
            name="image"
            render={({ field }) => (
              <div className="max-w-[300px]">
                <ImageUploader value={field.value ? [field.value] : []} max={1} multiple={false} onChange={(urls) => field.onChange(urls.at(-1) ?? '')} />
              </div>
            )}
          />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Icon" htmlFor="cat-icon" hint="Used when there is no picture.">
            <div className="flex items-center gap-2.5">
              <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-fill text-text">
                <CategoryIcon name={icon} image={image} size={20} />
              </span>
              <Select id="cat-icon" className={cn(selectClass, 'flex-1')} {...register('icon')}>
                {ICON_NAMES.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </Select>
            </div>
          </FormField>
          <FormField label="Menu name" htmlFor="cat-menu" hint="Optional shorter name for menus.">
            <input id="cat-menu" placeholder={name || 'e.g. Audio'} className={inputClass()} {...register('menuName')} />
          </FormField>
        </div>
        <FormField label="Short code" htmlFor="cat-code" error={errors.code?.message} hint="Optional, 1 to 4 letters or digits. Used in new product codes, e.g. TS-EB-001.">
          <input id="cat-code" maxLength={4} placeholder="EB" aria-invalid={Boolean(errors.code)} className={cn(inputClass(errors.code), 'uppercase')} {...register('code')} />
        </FormField>
        <div className="flex items-start justify-between gap-4 rounded-[10px] bg-fill-soft p-3.5">
          <div className="flex flex-col gap-0.5">
            <span className="text-[13px] font-semibold text-text">Active</span>
            <span className="text-body-sm text-text-muted">Inactive categories and their subcategories are hidden on the store.</span>
          </div>
          <Controller control={control} name="active" render={({ field }) => <Toggle checked={field.value} onChange={field.onChange} ariaLabel="Active" />} />
        </div>
      </form>
    </Modal>
  )
}

function StatusPill({ active }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-xl px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap', active ? 'bg-success-tint text-success' : 'bg-fill text-text-muted')}>
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {active ? 'Active' : 'Hidden'}
    </span>
  )
}

const iconButton = 'flex size-11 shrink-0 items-center justify-center rounded-lg border border-border-strong md:size-8 disabled:pointer-events-none disabled:opacity-35'

function Row({ category, child, first, last, reordering, expanded, onToggle, onMove, onAddSub, onEdit, onDelete }) {
  const active = category.active !== false
  return (
    <div className={cn('flex flex-wrap items-center gap-x-3 gap-y-2.5 px-4 py-3 md:flex-nowrap', child ? 'pl-8 md:pl-14' : 'bg-white')}>
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {child ? (
          <span aria-hidden="true" className="-ml-1 h-5 w-3 shrink-0 rounded-bl-md border-b border-l border-check-line" />
        ) : (
          <button
            type="button"
            onClick={onToggle}
            disabled={!category.children.length}
            aria-expanded={category.children.length ? expanded : undefined}
            aria-label={`${expanded ? 'Collapse' : 'Expand'} ${category.name}`}
            className="-ml-1.5 flex size-8 shrink-0 items-center justify-center rounded-lg text-text-muted hover:bg-fill disabled:invisible"
          >
            <ChevronDown size={16} className={cn('transition-transform', !expanded && '-rotate-90')} />
          </button>
        )}
        <span className={cn('flex shrink-0 items-center justify-center overflow-hidden rounded-lg', child ? 'size-10 bg-fill-soft text-text-muted' : 'size-12 bg-fill text-text', !active && 'opacity-50')}>
          <CategoryIcon name={category.icon} image={category.image} size={child ? 16 : 19} />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className={cn('flex min-w-0 items-center gap-2 text-[13px] text-text', child ? 'font-medium' : 'font-bold')}>
            <span className="truncate">{category.name}</span>
            {category.code && <span className="shrink-0 rounded bg-fill px-1.5 py-0.5 text-[10px] font-bold text-text-muted">{category.code}</span>}
          </span>
          <span className="truncate text-[11px] text-text-faint">/category/{category.slug}</span>
          <span className="flex items-center gap-2 pt-0.5 text-[11px] text-text-secondary md:hidden">
            <StatusPill active={active} />
            {plural(category.productCount ?? 0, 'product')}
            {!child && category.children.length > 0 && ` · ${plural(category.children.length, 'subcategory', 'subcategories')}`}
          </span>
        </div>
      </div>
      <span className="hidden w-20 shrink-0 md:block">
        <StatusPill active={active} />
      </span>
      <span className="hidden w-24 shrink-0 text-right text-[13px] text-text-secondary md:block">{plural(category.productCount ?? 0, 'product')}</span>
      <div className="flex w-full shrink-0 items-center justify-end gap-1.5 md:w-[264px]">
        <button type="button" onClick={() => onMove(-1)} disabled={first || reordering} aria-label={`Move ${category.name} up`} className={cn(iconButton, 'text-text hover:border-text-faint')}>
          <ArrowUp size={15} />
        </button>
        <button type="button" onClick={() => onMove(1)} disabled={last || reordering} aria-label={`Move ${category.name} down`} className={cn(iconButton, 'text-text hover:border-text-faint')}>
          <ArrowDown size={15} />
        </button>
        {!child && (
          <button
            type="button"
            onClick={onAddSub}
            className="mr-auto flex h-11 items-center gap-1 rounded-lg border border-border-strong px-2.5 text-[12px] font-semibold whitespace-nowrap text-primary hover:border-primary md:order-first md:mr-0 md:h-8"
          >
            <Plus size={14} />
            Subcategory
          </button>
        )}
        <button type="button" onClick={onEdit} aria-label={`Edit ${category.name}`} className={cn(iconButton, 'text-text hover:border-text-faint')}>
          <Pencil size={15} />
        </button>
        <button type="button" onClick={onDelete} aria-label={`Delete ${category.name}`} className={cn(iconButton, 'text-error hover:border-error')}>
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  )
}

// Figma "Admin – Categories" (60:8592).
export default function Categories() {
  const { data: categories, isLoading, isError, refetch } = useAdminCategories()
  const tree = useMemo(() => toTree(categories), [categories])
  const remove = useDeleteCategory()
  const reorder = useReorderCategories()
  // { category } to edit, { parent } for "+ Subcategory", {} to add.
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [blocked, setBlocked] = useState(null)
  const [collapsed, setCollapsed] = useState(() => new Set())

  const toggle = (id) =>
    setCollapsed((set) => {
      const next = new Set(set)
      if (!next.delete(id)) next.add(id)
      return next
    })

  const move = (siblings, index, step, parentId) => {
    const ids = siblings.map((c) => c.id)
    ;[ids[index], ids[index + step]] = [ids[index + step], ids[index]]
    reorder.mutate({ parentId, ids }, { onError: (error) => notify.error('Could not reorder categories', { description: errorMessage(error) }) })
  }

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

  const allCollapsed = tree.length > 0 && tree.every((p) => !p.children.length || collapsed.has(p.id))

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Categories"
        subtitle={categories ? `${tree.length} top level, ${categories.length - tree.length} subcategories` : 'Two levels: categories and their subcategories'}
        action={{ label: 'Add category', Icon: Plus, onClick: () => setEditing({}) }}
      >
        {tree.some((p) => p.children.length) && (
          <Button variant="secondary" onClick={() => setCollapsed(allCollapsed ? new Set() : new Set(tree.map((p) => p.id)))}>
            {allCollapsed ? 'Expand all' : 'Collapse all'}
          </Button>
        )}
      </PageHeader>

      <div className="overflow-hidden rounded-xl border border-border bg-white">
        <div className="hidden items-center gap-3 border-b border-border bg-fill-soft px-4 py-3 text-[11px] font-semibold text-text-muted md:flex">
          <span className="flex-1 pl-10">CATEGORY</span>
          <span className="w-20">STATUS</span>
          <span className="w-24 text-right">PRODUCTS</span>
          <span className="w-[264px] text-right">ACTIONS</span>
        </div>
        {isError ? (
          <ErrorState onRetry={refetch} />
        ) : isLoading ? (
          <div role="status" aria-label="Loading">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className={cn('flex items-center gap-3 border-b border-row-line px-4 py-3', i % 3 && 'pl-14')}>
                <Skeleton className="size-10 rounded-lg" />
                <Skeleton className="h-4 max-w-[220px] flex-1" />
              </div>
            ))}
          </div>
        ) : tree.length === 0 ? (
          <EmptyState Icon={FolderTree} title="No categories yet" text="Add a category to start organising products." action={{ label: 'Add category', Icon: Plus, onClick: () => setEditing({}) }} />
        ) : (
          <ul>
            {tree.map((parent, i) => {
              const expanded = !collapsed.has(parent.id)
              return (
                <li key={parent.id} className="border-b border-border last:border-b-0">
                  <Row
                    category={parent}
                    first={i === 0}
                    last={i === tree.length - 1}
                    reordering={reorder.isPending}
                    expanded={expanded}
                    onToggle={() => toggle(parent.id)}
                    onMove={(step) => move(tree, i, step, null)}
                    onAddSub={() => setEditing({ parent })}
                    onEdit={() => setEditing({ category: parent })}
                    onDelete={() => setDeleting(parent)}
                  />
                  {expanded && parent.children.length > 0 && (
                    <ul className="border-t border-row-line bg-fill-soft">
                      {parent.children.map((child, j) => (
                        <li key={child.id} className="border-b border-row-line last:border-b-0">
                          <Row
                            child
                            category={child}
                            first={j === 0}
                            last={j === parent.children.length - 1}
                            reordering={reorder.isPending}
                            onMove={(step) => move(parent.children, j, step, parent.id)}
                            onEdit={() => setEditing({ category: child })}
                            onDelete={() => setDeleting(child)}
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {editing && <CategoryModal category={editing.category ?? null} lockedParent={editing.parent ?? null} parents={tree} onClose={() => setEditing(null)} />}

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
