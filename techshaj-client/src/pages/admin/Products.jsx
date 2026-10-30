import { ImageOff, Package, Pencil, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import CategoryOptions from '../../components/admin/CategoryOptions.jsx'
import ConfirmDialog from '../../components/admin/ConfirmDialog.jsx'
import DataTable from '../../components/admin/DataTable.jsx'
import ErrorState from '../../components/admin/ErrorState.jsx'
import PageHeader from '../../components/admin/PageHeader.jsx'
import Pagination from '../../components/admin/Pagination.jsx'
import SearchInput from '../../components/admin/SearchInput.jsx'
import Select from '../../components/admin/Select.jsx'
import { FreeDeliveryBadge } from '../../components/admin/StockBadge.jsx'
import StockEditor from '../../components/admin/StockEditor.jsx'
import Toggle from '../../components/admin/Toggle.jsx'
import { toTree, useAdminCategories } from '../../hooks/useAdminCategories.js'
import { useAdminProducts, useDeleteProduct, useUpdateProduct } from '../../hooks/useAdminProducts.js'
import { formatPrice } from '../../lib/adminFormat.js'
import { notify } from '../../lib/notify.jsx'
import { errorMessage } from '../../lib/query.js'

const PAGE_SIZE = 20
const FILTER_KEYS = ['search', 'category', 'status', 'stock']

function Thumb({ src }) {
  const [failed, setFailed] = useState(false)
  return (
    <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-fill text-text-faint">
      {src && !failed ? <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} className="size-full object-cover" /> : <ImageOff size={18} />}
    </span>
  )
}

const iconButton = 'flex size-8 items-center justify-center rounded-lg border border-border-strong text-text-secondary hover:border-text-faint hover:text-text disabled:opacity-50'

// Figma "Admin – Products" (59:8184).
export default function Products() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const filters = Object.fromEntries(FILTER_KEYS.map((k) => [k, params.get(k) ?? '']))
  const page = Math.max(Number(params.get('page')) || 1, 1)
  const query = { ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)), page, limit: PAGE_SIZE }

  const { data, isLoading, isError, refetch, isFetching } = useAdminProducts(query)
  const { data: categories = [] } = useAdminCategories()
  const tree = useMemo(() => toTree(categories), [categories])
  const categoryName = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c.name])), [categories])

  const update = useUpdateProduct()
  const remove = useDeleteProduct()
  const [toggling, setToggling] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const setFilter = (key, value) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (value) next.set(key, value)
        else next.delete(key)
        if (key !== 'page') next.delete('page')
        return next
      },
      { replace: key === 'search' },
    )

  const togglePublished = (product) => {
    setToggling(product.id)
    update.mutate(
      { id: product.id, data: { published: product.published === false } },
      {
        onSuccess: (p) => notify.success(p.published === false ? 'Saved as draft' : 'Product published', { description: p.name }),
        onError: (error) => notify.error('Could not update product', { description: errorMessage(error) }),
        onSettled: () => setToggling(null),
      },
    )
  }

  const confirmDelete = () =>
    remove.mutate(deleting.id, {
      onSuccess: () => {
        notify.success('Product deleted', { description: deleting.name })
        setDeleting(null)
        if (data?.products.length === 1 && page > 1) setFilter('page', String(page - 1))
      },
      onError: (error) => notify.error('Could not delete product', { description: errorMessage(error) }),
    })

  const edit = (p) => navigate(`/admin/products/${p.id}/edit`, { state: { code: p.code } })
  const hasFilters = FILTER_KEYS.some((k) => filters[k])

  const columns = [
    {
      key: 'product',
      header: 'Product',
      render: (p) => (
        <div className="flex min-w-[240px] items-center gap-3">
          <Thumb src={p.images?.[0]} />
          <div className="flex min-w-0 flex-col items-start gap-0.5">
            <span className="line-clamp-2 text-[13px] font-semibold text-text">{p.name}</span>
            <span className="text-[11px] text-text-faint">{p.code}</span>
            {p.freeDelivery && <FreeDeliveryBadge />}
          </div>
        </div>
      ),
    },
    { key: 'category', header: 'Category', render: (p) => <span className="whitespace-nowrap">{categoryName[p.categoryId] ?? '—'}</span> },
    {
      key: 'price',
      header: 'Price',
      render: (p) => (
        <div className="flex flex-col gap-px whitespace-nowrap">
          <span className="font-bold text-text">{formatPrice(p.price)}</span>
          {p.oldPrice > p.price && <s className="text-[11px] text-text-faint">{formatPrice(p.oldPrice)}</s>}
        </div>
      ),
    },
    { key: 'stock', header: 'Stock', render: (p) => <StockEditor product={p} /> },
    {
      key: 'published',
      header: 'Status',
      render: (p) => (
        <Toggle checked={p.published !== false} disabled={toggling === p.id} onChange={() => togglePublished(p)} label={p.published === false ? 'Draft' : 'Published'} className="whitespace-nowrap [&>span]:text-[12px] [&>span]:font-medium" />
      ),
    },
    {
      key: 'actions',
      header: <span className="sr-only">Actions</span>,
      align: 'right',
      render: (p) => (
        <div className="flex justify-end gap-1.5">
          <button type="button" onClick={() => edit(p)} aria-label={`Edit ${p.name}`} className={iconButton}>
            <Pencil size={15} />
          </button>
          <button type="button" onClick={() => setDeleting(p)} aria-label={`Delete ${p.name}`} className={`${iconButton} hover:border-error hover:text-error`}>
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Products"
        subtitle={data ? `${data.total} ${data.total === 1 ? 'product' : 'products'}${hasFilters ? ' match these filters' : ''}` : 'Your catalog'}
        action={{ label: 'New product', Icon: Plus, to: '/admin/products/new' }}
      />

      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_200px_150px_150px]">
        <SearchInput
          value={filters.search}
          onChange={(v) => setFilter('search', v)}
          placeholder="Search by name, code or slug"
          className="rounded-lg border border-border-strong bg-white sm:col-span-2 lg:col-span-1"
        />
        <Select value={filters.category} onChange={(e) => setFilter('category', e.target.value)} aria-label="Category">
          <option value="">All categories</option>
          <CategoryOptions tree={tree} />
        </Select>
        <Select value={filters.stock} onChange={(e) => setFilter('stock', e.target.value)} aria-label="Stock">
          <option value="">All stock</option>
          <option value="in">In stock</option>
          <option value="low">Low stock (1–5)</option>
          <option value="out">Out of stock</option>
        </Select>
        <Select value={filters.status} onChange={(e) => setFilter('status', e.target.value)} aria-label="Status">
          <option value="">All status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </Select>
      </div>

      {isError ? (
        <div className="rounded-xl border border-border bg-white">
          <ErrorState onRetry={refetch} />
        </div>
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={data?.products}
            rowKey="id"
            loading={isLoading}
            className={isFetching && !isLoading ? 'opacity-70 transition-opacity' : undefined}
            empty={
              hasFilters
                ? { Icon: Package, title: 'No products found', text: 'Try a different search or clear the filters.', action: { label: 'Clear filters', onClick: () => setParams({}) } }
                : { Icon: Package, title: 'No products yet', text: 'Add your first product to start selling.', action: { label: 'New product', Icon: Plus, to: '/admin/products/new' } }
            }
          />
          {data && <Pagination page={page} totalPages={data.totalPages} total={data.total} pageSize={PAGE_SIZE} onChange={(p) => setFilter('page', p > 1 ? String(p) : '')} />}
        </>
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        loading={remove.isPending}
        danger
        title="Delete product?"
        message={deleting && `"${deleting.name}" will be deleted for good and also removed from the flash sale. This cannot be undone.`}
        confirmLabel="Delete"
      />
    </div>
  )
}
