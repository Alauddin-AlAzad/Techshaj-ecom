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
  return { rows: (parents ?? []).map((c, i) => ({ category: c, query: results[i] })), results: results.map(pick) }
}

// Each section loads on its own and shows skeleton cards until its products arrive.
export default function Home() {
  usePageTitle()
  const bannersQuery = useBanners()
  const offersQuery = useOffers()
  const categoriesQuery = useCategories()
  const bestDealsQuery = useProducts({ collection: 'best-deal', limit: ROW_LIMIT })
  const bestSellersQuery = useProducts({ collection: 'best-seller', limit: ROW_LIMIT })
  const newArrivalsQuery = useProducts({ collection: 'new-arrival', limit: ROW_LIMIT })
  const { rows: categoryRows, results: rowResults } = useCategoryRows(categoriesQuery.data)
  const all = [bannersQuery, offersQuery, categoriesQuery, bestDealsQuery, bestSellersQuery, newArrivalsQuery, ...rowResults]

  // Nothing could load at all: likely offline or the server is down.
  if (all.every((q) => q.isError)) return <ErrorState onRetry={combine(...all).refetch} />
  if (categoriesQuery.isLoading && bannersQuery.isLoading) return <HomeSkeleton />

  const categories = categoriesQuery.data ?? []
  const flat = categories.flatMap((p) => [p, ...p.children])
  const featured = storefront.featuredCategorySlugs.map((slug) => flat.find((c) => c.slug === slug)).filter(Boolean)

  const row = (title, query, seeAllTo, tag) => <ProductRow title={title} tag={tag} products={query.data?.products} loading={query.isLoading} seeAllTo={seeAllTo} />
  const categoryRow = ({ category, query }) => (
    <ProductRow key={category.id} title={category.name} products={query?.data?.products} loading={!query || query.isLoading} seeAllTo={`/category/${category.slug}`} />
  )

  return (
    <div className="pb-10 lg:pb-[72px]">
      <CategoryChips categories={categories} />
      <HeroSection banners={bannersQuery.data} loading={bannersQuery.isLoading} />
      <TrustBadges />
      <FeaturedCategories categories={featured} />
      <FlashSale flashSale={offersQuery.data?.flashSale} loading={offersQuery.isLoading} />
      {row('Best Sellers', bestSellersQuery, '/shop?col=best-seller', 'HOT')}
      {row('New Arrivals', newArrivalsQuery, '/shop?col=new-arrival')}
      {row('Best Deals', bestDealsQuery, '/shop?col=best-deal')}
      {categoryRows.slice(0, 1).map(categoryRow)}
      <PromoBanners promos={bannersQuery.data?.promo} />
      {categoryRows.slice(1).map(categoryRow)}
    </div>
  )
}
