import { matchesSearch } from '../data/api.js'

export const PAGE_SIZE = 12

export const SORTS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'best-selling', label: 'Best Selling' },
]

const list = (v) => (v ? v.split(',').filter(Boolean) : [])

export const toggleValue = (values, value) => (values.includes(value) ? values.filter((v) => v !== value) : [...values, value])

// URL query <-> filter state. Keys: q, cat, col, color, brand, min, max, stock, sort, page
export function parseFilters(params) {
  return {
    q: params.get('q') ?? '',
    cats: list(params.get('cat')),
    hasCatParam: params.has('cat'),
    cols: list(params.get('col') ?? params.get('collection')),
    colors: list(params.get('color')),
    brands: list(params.get('brand')),
    min: params.get('min') ? Number(params.get('min')) : null,
    max: params.get('max') ? Number(params.get('max')) : null,
    stock: params.get('stock') === '1',
    sort: params.get('sort') ?? 'newest',
    page: Math.max(1, Number(params.get('page')) || 1),
  }
}

export function filtersToParams(f) {
  const out = {}
  if (f.q) out.q = f.q
  if (f.cats.length) out.cat = f.cats.join(',')
  if (f.cols.length) out.col = f.cols.join(',')
  if (f.colors.length) out.color = f.colors.join(',')
  if (f.brands.length) out.brand = f.brands.join(',')
  if (f.min != null) out.min = String(f.min)
  if (f.max != null) out.max = String(f.max)
  if (f.stock) out.stock = '1'
  if (f.sort && f.sort !== 'newest') out.sort = f.sort
  if (f.page > 1) out.page = String(f.page)
  return out
}

export function activeFilterCount(f) {
  return f.cats.length + f.cols.length + f.colors.length + f.brands.length + (f.stock ? 1 : 0) + (f.min != null || f.max != null ? 1 : 0)
}

export function colorFamilies(product, colors) {
  const options = product.variants.find((v) => v.name === 'Color')?.options ?? []
  return colors.filter((c) => options.some((o) => o === c.name || c.aliases.includes(o))).map((c) => c.name)
}

// `skip` leaves one facet out so its own counts are not narrowed by itself.
export function applyFilters(products, f, { categories, colors }, skip) {
  const catIds = new Set(f.cats.map((slug) => categories.find((c) => c.slug === slug)?.id))
  return products.filter(
    (p) =>
      matchesSearch(p, f.q) &&
      (skip === 'cat' || !f.cats.length || catIds.has(p.categoryId)) &&
      (skip === 'col' || !f.cols.length || f.cols.some((c) => p.collections.includes(c))) &&
      (skip === 'color' || !f.colors.length || colorFamilies(p, colors).some((c) => f.colors.includes(c))) &&
      (skip === 'brand' || !f.brands.length || f.brands.includes(p.brand)) &&
      (f.min == null || p.price >= f.min) &&
      (f.max == null || p.price <= f.max) &&
      (!f.stock || p.stock > 0),
  )
}

export function sortProducts(products, sort) {
  const sorted = [...products]
  if (sort === 'price-asc') return sorted.sort((a, b) => a.price - b.price)
  if (sort === 'price-desc') return sorted.sort((a, b) => b.price - a.price)
  if (sort === 'best-selling') return sorted.sort((a, b) => b.soldCount - a.soldCount)
  return sorted.sort((a, b) => b.isNew - a.isNew || b.id - a.id)
}

export function countBy(products, keyFn) {
  const counts = new Map()
  for (const p of products) for (const k of [].concat(keyFn(p))) counts.set(k, (counts.get(k) ?? 0) + 1)
  return counts
}
