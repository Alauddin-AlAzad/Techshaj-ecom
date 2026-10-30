import 'swiper/css'
import CategoryChips from '../components/home/CategoryChips.jsx'
import FeaturedCategories from '../components/home/FeaturedCategories.jsx'
import FlashSale from '../components/home/FlashSale.jsx'
import HeroSection from '../components/home/HeroSection.jsx'
import ProductRow from '../components/home/ProductRow.jsx'
import PromoBanners from '../components/home/PromoBanners.jsx'
import TrustBadges from '../components/home/TrustBadges.jsx'
import { useQueries } from '@tanstack/react-query'
import ErrorState from '../components/ErrorState.jsx'
import { HomeSkeleton } from '../components/Skeleton.jsx'
import storefront from '../data/storefront.json'
import { useAxiosPublic } from '../hooks/useAxiosPublic.js'
import { useBanners } from '../hooks/useBanners.js'
import { useCategories } from '../hooks/useCategories.js'
import { useOffers } from '../hooks/useOffers.js'
import { usePageTitle } from '../hooks/usePageTitle.js'
import { productsQuery, useProducts } from '../hooks/useProducts.js'
import { combine, pick } from '../lib/query.js'

const ROW_LIMIT = 20

// One product row per department, loaded in parallel.
function useCategoryRows(parents) {
  const axiosPublic = useAxiosPublic()
  const results = useQueries({ queries: (parents ?? []).map((c) => productsQuery(axiosPublic, { category: c.slug, limit: ROW_LIMIT })) })
  const rows = parents && results.every((r) => r.data) ? parents.map((c, i) => ({ category: c, products: results[i].data.products })) : null
  return { rows, results: results.map(pick) }
}

export default function Home() {
  usePageTitle()
  const bannersQuery = useBanners()
  const offersQuery = useOffers()
  const categoriesQuery = useCategories()
  const bestDealsQuery = useProducts({ collection: 'best-deal', limit: ROW_LIMIT })
  const bestSellersQuery = useProducts({ collection: 'best-seller', limit: ROW_LIMIT })
  const { rows: categoryRows, results: rowResults } = useCategoryRows(categoriesQuery.data)
  const status = combine(bannersQuery, offersQuery, categoriesQuery, bestDealsQuery, bestSellersQuery, ...rowResults)

  // Everything loads together so the page swaps from the skeleton in one step.
  const ready = bannersQuery.data && offersQuery.data && bestDealsQuery.data && bestSellersQuery.data && categoryRows
  if (!ready && status.isError) return <ErrorState onRetry={status.refetch} />
  if (!ready) return <HomeSkeleton />

  const banners = bannersQuery.data
  const offers = offersQuery.data
  const bestDeals = bestDealsQuery.data.products
  const bestSellers = bestSellersQuery.data.products
  const flat = categoriesQuery.data.flatMap((p) => [p, ...p.children])
  const featured = storefront.featuredCategorySlugs.map((slug) => flat.find((c) => c.slug === slug)).filter(Boolean)

  const categoryRow = ({ category, products }) => (
    <ProductRow key={category.id} title={category.name} products={products} seeAllTo={`/category/${category.slug}`} />
  )

  return (
    <div className="pb-10 lg:pb-[72px]">
      <CategoryChips categories={categoryRows.map((r) => r.category)} />
      <HeroSection banners={banners} />
      <TrustBadges />
      <FeaturedCategories categories={featured} />
      <ProductRow title="Best Deals" products={bestDeals} seeAllTo="/shop?collection=best-deal" mobile="grid" />
      <FlashSale flashSale={offers?.flashSale} />
      {categoryRows.slice(0, 1).map(categoryRow)}
      <ProductRow title="Best Sellers" tag="HOT" products={bestSellers} seeAllTo="/shop?collection=best-seller" mobile="grid" />
      <PromoBanners promos={banners?.promo} />
      {categoryRows.slice(1).map(categoryRow)}
    </div>
  )
}
