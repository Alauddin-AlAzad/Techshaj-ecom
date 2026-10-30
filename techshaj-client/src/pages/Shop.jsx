import { Menu, Search } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import Breadcrumbs from '../components/Breadcrumbs.jsx'
import ProductCard from '../components/ProductCard.jsx'
import { ShopSkeleton } from '../components/Skeleton.jsx'
import FilterPanel from '../components/shop/FilterPanel.jsx'
import FilterSheet from '../components/shop/FilterSheet.jsx'
import Pagination from '../components/shop/Pagination.jsx'
import SortSelect from '../components/shop/SortSelect.jsx'
import { getCategories, getProducts, getShopMeta } from '../data/api.js'
import { useAsync } from '../hooks/useAsync.js'
import { usePageTitle } from '../hooks/usePageTitle.js'
import { cn } from '../lib/cn.js'
import {
  activeFilterCount,
  applyFilters,
  colorFamilies,
  countBy,
  filtersToParams,
  PAGE_SIZE,
  parseFilters,
  sortProducts,
} from '../lib/shopFilters.js'
import NotFound from './NotFound.jsx'

async function loadShop() {
  const [products, tree, meta] = await Promise.all([getProducts(), getCategories(), getShopMeta()])
  return { products, tree, flat: tree.flatMap((p) => [p, ...p.children]), ...meta }
}

const quickCollections = [
  { slug: 'best-seller', label: 'Bestsellers' },
  { slug: 'best-deal', label: 'Best Deals' },
]

// Remounted by key when the q param changes.
function InlineSearch({ initial, placeholder, onSubmit }) {
  const [value, setValue] = useState(initial)
  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit(value.trim())
      }}
      className="flex h-[46px] w-full max-w-[640px] items-center gap-2.5 rounded-[23px] border-[1.5px] border-primary pr-1 pl-[18px]"
    >
      <Search size={18} className="shrink-0 text-text-faint" />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="min-w-0 flex-1 bg-transparent text-body text-text outline-none placeholder:text-text-faint"
      />
      <button type="submit" aria-label="Search" className="flex size-[38px] shrink-0 items-center justify-center rounded-full bg-primary text-white">
        <Search size={18} />
      </button>
    </form>
  )
}

export default function Shop() {
  const { slug } = useParams()
  const [params, setParams] = useSearchParams()
  const [sheetOpen, setSheetOpen] = useState(false)
  const closeSheet = useCallback(() => setSheetOpen(false), [])
  const data = useAsync(loadShop)

  const category = slug ? data?.flat.find((c) => c.slug === slug) : null
  const parent = category?.parentId ? data.flat.find((c) => c.id === category.parentId) : null
  // A category page filters to its own leaf categories until the user picks categories explicitly.
  const scopeCats = useMemo(() => (category ? (category.parentId ? [category.slug] : category.children.map((c) => c.slug)) : []), [category])

  const raw = parseFilters(params)
  const filters = { ...raw, cats: raw.hasCatParam ? raw.cats : scopeCats }
  const emptyFilters = { ...filters, cats: scopeCats, cols: [], colors: [], brands: [], min: null, max: null, stock: false, page: 1 }

  const view = useMemo(() => {
    if (!data) return null
    const ctx = { categories: data.flat, colors: data.colors }
    const results = sortProducts(applyFilters(data.products, filters, ctx), filters.sort)
    const catCounts = countBy(applyFilters(data.products, filters, ctx, 'cat'), (p) => p.categoryId)
    const colCounts = countBy(applyFilters(data.products, filters, ctx, 'col'), (p) => p.collections)
    const colorCounts = countBy(applyFilters(data.products, filters, ctx, 'color'), (p) => colorFamilies(p, data.colors))
    const brandCounts = countBy(applyFilters(data.products, filters, ctx, 'brand'), (p) => p.brand)
    const prices = data.products.map((p) => p.price)

    const facets = {
      price: { min: Math.floor(Math.min(...prices) / 50) * 50, max: Math.ceil(Math.max(...prices) / 50) * 50 },
      categories: data.flat
        .filter((c) => c.parentId && (catCounts.get(c.id) || filters.cats.includes(c.slug)))
        .map((c) => ({ slug: c.slug, name: c.name, count: catCounts.get(c.id) ?? 0 }))
        .sort((a, b) => filters.cats.includes(b.slug) - filters.cats.includes(a.slug) || b.count - a.count),
      collections: data.collections.map((c) => ({ ...c, count: colCounts.get(c.slug) ?? 0 })),
      colors: data.colors.filter((c) => colorCounts.get(c.name)).map((c) => ({ ...c, count: colorCounts.get(c.name) })),
      brands: [...brandCounts].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
    }
    return { results, facets, ctx }
  }, [data, params, scopeCats]) // eslint-disable-line react-hooks/exhaustive-deps

  usePageTitle(data && (category?.name ?? (slug ? 'Page not found' : raw.q ? `Search: ${raw.q}` : 'Shop')))

  if (!data) return <ShopSkeleton />
  if (slug && !category) return <NotFound />

  const write = (next, { keepCats } = {}) => {
    const out = filtersToParams(next)
    if (!keepCats && !raw.hasCatParam) delete out.cat
    setParams(out)
  }
  const update = (patch) => write({ ...filters, page: 1, ...patch }, { keepCats: 'cats' in patch })
  const clearAll = () => setParams(filtersToParams({ ...emptyFilters, cats: [], q: filters.q, sort: filters.sort }))

  const { results, facets, ctx } = view
  const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE))
  const page = Math.min(filters.page, totalPages)
  const title = category?.name ?? (filters.q ? `Results for “${filters.q}”` : 'Shop')
  const crumbs = [
    { label: 'Home', to: '/' },
    ...(category ? [] : [{ label: 'Shop', to: '/shop' }]),
    ...(parent ? [{ label: parent.name, to: `/category/${parent.slug}` }] : []),
    ...(category ? [{ label: category.name }] : []),
  ]
  const activeCount = activeFilterCount({ ...filters, cats: raw.hasCatParam ? raw.cats : [] })

  // Mobile chips: sub-categories of the current department, or departments on /shop.
  const chipParent = category ? (parent ?? category) : null
  const chips = chipParent ? chipParent.children : data.tree

  const empty = (
    <div className="col-span-full flex flex-col items-center gap-3 rounded-xl bg-surface px-4 py-16 text-center">
      <p className="text-label text-text">No products match these filters.</p>
      <button type="button" onClick={clearAll} className="text-label text-primary">
        Clear all filters
      </button>
    </div>
  )

  return (
    <div className="pb-9 lg:pb-[72px]">
      {/* Desktop title band */}
      <div className="hidden bg-surface lg:block">
        <Breadcrumbs items={crumbs} className="site-container h-12" />
      </div>
      <div className="site-container hidden flex-col items-center gap-[18px] pt-7 lg:flex">
        <h1 className="font-heading text-[30px] font-bold tracking-[-0.45px] text-text">{title}</h1>
        <InlineSearch key={filters.q} initial={filters.q} placeholder={`Search in ${category?.name ?? 'all products'}…`} onSubmit={(q) => update({ q })} />
      </div>

      {/* Mobile title */}
      <div className="site-container flex flex-col items-start gap-1 pt-4 lg:hidden">
        <Breadcrumbs items={crumbs} />
        <h1 className="font-heading text-[24px] font-bold tracking-[-0.36px] text-text">{title}</h1>
      </div>
      <div className="site-container flex gap-2.5 pt-3.5 lg:hidden">
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="flex h-[42px] flex-1 items-center justify-center gap-2 rounded-[10px] border border-border-strong text-[13px] font-semibold text-text"
        >
          <Menu size={16} />
          Filter{activeCount > 0 && ` (${activeCount})`}
        </button>
        <SortSelect value={filters.sort} onChange={(sort) => update({ sort })} iconFirst className="h-[42px] flex-1 justify-center rounded-[10px] text-[13px]" />
      </div>
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pt-3 lg:hidden">
        {chipParent && category?.parentId ? (
          <Link to={`/category/${chipParent.slug}`} className="shrink-0 rounded-2xl bg-fill px-3.5 py-[7px] text-label-sm text-text-secondary">
            All {chipParent.shortName ?? chipParent.name}
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => update({ cats: [] })}
            className={cn('shrink-0 rounded-2xl px-3.5 py-[7px] text-label-sm', !raw.hasCatParam ? 'bg-text text-white' : 'bg-fill text-text-secondary')}
          >
            All {chipParent ? (chipParent.shortName ?? chipParent.name) : 'Products'}
          </button>
        )}
        {chips.map((c) => {
          const active = category?.parentId ? c.slug === category.slug : raw.hasCatParam && raw.cats.length === 1 && raw.cats[0] === c.slug
          const cls = cn('shrink-0 rounded-2xl px-3.5 py-[7px] text-label-sm whitespace-nowrap', active ? 'bg-text text-white' : 'bg-fill text-text-secondary')
          return chipParent && !category.parentId ? (
            <button key={c.slug} type="button" onClick={() => update({ cats: [c.slug] })} className={cls}>
              {c.name}
            </button>
          ) : (
            <Link key={c.slug} to={`/category/${c.slug}`} className={cls}>
              {c.shortName ?? c.name}
            </Link>
          )
        })}
      </div>
      <p className="site-container pt-3.5 text-[13px] text-text-muted lg:hidden">
        <span className="font-bold text-text">{results.length}</span> products found
      </p>

      <div className="site-container flex items-start gap-6 pt-3 lg:pt-6">
        <div className="hidden w-[260px] shrink-0 lg:block">
          <FilterPanel filters={filters} facets={facets} onChange={update} onClear={clearAll} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="hidden items-center justify-between gap-4 lg:flex">
            <p className="text-body text-text-muted">
              <span className="font-bold text-text">{results.length}</span> products found
            </p>
            <div className="flex items-center gap-2">
              {quickCollections.map((q) => {
                const active = filters.cols.includes(q.slug)
                return (
                  <button
                    key={q.slug}
                    type="button"
                    aria-pressed={active}
                    onClick={() => update({ cols: active ? filters.cols.filter((c) => c !== q.slug) : [...filters.cols, q.slug] })}
                    className={cn(
                      'rounded-2xl border px-3 py-[7px] text-label-sm',
                      active ? 'border-highlight bg-highlight-soft text-highlight-ink' : 'border-border-strong text-text-secondary',
                    )}
                  >
                    {q.label}
                  </button>
                )
              })}
              <SortSelect value={filters.sort} onChange={(sort) => update({ sort })} className="rounded-lg px-3 py-2 text-body-sm" />
            </div>
          </div>

          {/* Desktop: paged grid */}
          <div className="mt-[18px] hidden grid-cols-3 gap-x-4 gap-y-[22px] lg:grid xl:grid-cols-4">
            {results.length
              ? results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((p) => <ProductCard key={p.id} product={p} orderOnHover />)
              : empty}
          </div>
          <div className="mt-[18px] hidden lg:block">
            <Pagination page={page} total={totalPages} onChange={(p) => write({ ...filters, page: p }, { keepCats: raw.hasCatParam })} />
          </div>

          {/* Mobile: load more */}
          <div className="grid grid-cols-2 gap-x-2.5 gap-y-[18px] lg:hidden">{results.length ? results.slice(0, page * PAGE_SIZE).map((p) => <ProductCard key={p.id} product={p} />) : empty}</div>
          {page < totalPages && (
            <button
              type="button"
              onClick={() => write({ ...filters, page: page + 1 }, { keepCats: raw.hasCatParam })}
              className="mt-5 flex h-[46px] w-full items-center justify-center rounded-[10px] border border-text text-label text-text lg:hidden"
            >
              Load more products
            </button>
          )}
        </div>
      </div>

      {sheetOpen && (
        <FilterSheet
          onClose={closeSheet}
          filters={filters}
          facets={facets}
          emptyFilters={emptyFilters}
          countFor={(draft) => applyFilters(data.products, draft, ctx).length}
          onApply={(draft) => {
            const sameCats = draft.cats.join() === scopeCats.join()
            write({ ...draft, page: 1 }, { keepCats: !sameCats || raw.hasCatParam })
            setSheetOpen(false)
          }}
        />
      )}
    </div>
  )
}
