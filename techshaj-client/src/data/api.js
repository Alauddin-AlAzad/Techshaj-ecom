import data from './fakeData.json'
import pages from './pages.json'

// Async so pages won't need to change when this switches to a real backend.
const resolve = (value) => Promise.resolve(structuredClone(value ?? null))

// Fake network latency for product lists and details so loading skeletons show.
export const LOADING_DELAY = 600
const delayed = (value) => new Promise((done) => setTimeout(() => done(structuredClone(value ?? null)), LOADING_DELAY))

const childIdsOf = (categoryId) => data.categories.filter((c) => c.parentId === categoryId).map((c) => c.id)

const productCount = (category) => {
  const ids = category.parentId ? [category.id] : childIdsOf(category.id)
  return data.products.filter((p) => ids.includes(p.categoryId)).length
}

const withCount = (category) => ({ ...category, productCount: productCount(category) })

export function getStore() {
  return resolve({ ...data.store, shipping: data.shipping })
}

function filterProducts({ category, collection, search, isNew, limit } = {}) {
  let list = data.products

  if (category) {
    const cat = data.categories.find((c) => c.slug === category)
    if (!cat) return []
    const ids = cat.parentId ? [cat.id] : childIdsOf(cat.id)
    list = list.filter((p) => ids.includes(p.categoryId))
  }
  if (collection) list = list.filter((p) => p.collections.includes(collection))
  if (isNew !== undefined) list = list.filter((p) => p.isNew === isNew)
  if (search) list = list.filter((p) => matchesSearch(p, search))
  if (limit) list = list.slice(0, limit)

  return list
}

export function getProducts(options) {
  return delayed(filterProducts(options))
}

// Search matches product name and code only.
export function matchesSearch(product, query) {
  const q = query.trim().toLowerCase()
  return !q || product.name.toLowerCase().includes(q) || product.code.toLowerCase().includes(q)
}

export function searchProducts(query, limit = 5) {
  const all = query.trim() ? data.products.filter((p) => matchesSearch(p, query)) : []
  return resolve({ total: all.length, results: all.slice(0, limit) })
}

export function getReviews(productId) {
  return resolve(data.reviews.filter((r) => r.productId === productId))
}

export function getShopMeta() {
  return resolve({ collections: data.collections, colors: data.colors })
}

const productsByIds = (ids) => ids.map((id) => data.products.find((p) => p.id === id)).filter(Boolean)

// Keeps the order of the given ids. The cart passes { instant: true } so totals don't flash.
export function getProductsByIds(ids = [], { instant = false } = {}) {
  return (instant ? resolve : delayed)(productsByIds(ids))
}

// Product page payload: the product with its category, reviews and up to 10 related products.
export function getProductDetails(slug) {
  const product = data.products.find((p) => p.slug === slug)
  if (!product) return delayed(null)

  const category = data.categories.find((c) => c.id === product.categoryId)
  const parent = data.categories.find((c) => c.id === category?.parentId) ?? null
  // Same category first, then the rest of the department.
  const related = [...filterProducts({ category: category.slug }), ...(parent ? filterProducts({ category: parent.slug }) : [])]
    .filter((p, i, all) => p.id !== product.id && all.findIndex((x) => x.id === p.id) === i)
    .slice(0, 10)

  return delayed({
    product: { ...product, category, parentCategory: parent },
    reviews: data.reviews.filter((r) => r.productId === product.id),
    related,
  })
}

// Returns parent categories with their children nested.
export function getCategories() {
  const parents = data.categories.filter((c) => !c.parentId)
  return resolve(
    parents.map((p) => ({
      ...withCount(p),
      children: data.categories.filter((c) => c.parentId === p.id).map(withCount),
    })),
  )
}

export function getCategoryBySlug(slug) {
  const category = data.categories.find((c) => c.slug === slug)
  if (!category) return resolve(null)

  return resolve({
    ...withCount(category),
    parent: data.categories.find((c) => c.id === category.parentId) ?? null,
    children: data.categories.filter((c) => c.parentId === category.id).map(withCount),
  })
}

export function getBanners() {
  return resolve({
    hero: data.banners.hero.filter((b) => b.active),
    side: data.banners.side.filter((b) => b.active),
    promo: data.banners.promo.filter((b) => b.active),
    menu: data.banners.menu?.active ? data.banners.menu : null,
  })
}

export function getFeaturedCategories() {
  return resolve(
    data.home.featuredCategorySlugs.map((slug) => data.categories.find((c) => c.slug === slug)).filter(Boolean),
  )
}

export function getPopularLinks() {
  return resolve(data.home.popularLinks ?? [])
}

// Most sold product in a category, for the desktop category dropdown.
export function getBestSeller(categorySlug) {
  return resolve(filterProducts({ category: categorySlug }).reduce((best, p) => (!best || p.soldCount > best.soldCount ? p : best), null))
}

export function getCoupons() {
  return resolve(data.offers.coupons)
}

export function getOffers() {
  const { flashSale, coupons } = data.offers
  return delayed({
    coupons,
    flashSale: {
      ...flashSale,
      products: data.products.filter((p) => flashSale.productIds.includes(p.id)),
    },
  })
}

// When a phone is given it must match, so the Track Order page can't expose other customers' orders.
export function getOrderById(id, phone) {
  const order = data.orders.find((o) => o.id.toLowerCase() === String(id).trim().toLowerCase())
  if (!order || (phone && order.phone !== phone.trim())) return resolve(null)
  return resolve(order)
}

export function getOrdersByPhone(phone) {
  return resolve(data.orders.filter((o) => o.phone === phone.trim()))
}

export function getPage(key) {
  return resolve(pages[key])
}
