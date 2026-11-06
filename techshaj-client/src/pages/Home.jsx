import 'swiper/css'
import FeaturedCategories from '../components/home/FeaturedCategories.jsx'
import FlashSale from '../components/home/FlashSale.jsx'
import HeroSection from '../components/home/HeroSection.jsx'
import ProductRow from '../components/home/ProductRow.jsx'
import PromoBanners from '../components/home/PromoBanners.jsx'
import TrustBadges from '../components/home/TrustBadges.jsx'
import ErrorState from '../components/ErrorState.jsx'
import { HomeSkeleton } from '../components/Skeleton.jsx'
import storefront from '../data/storefront.json'
import { useBanners } from '../hooks/useBanners.js'
import { useCategories } from '../hooks/useCategories.js'
import { useHomeRows } from '../hooks/useHomeRows.js'
import { useOffers } from '../hooks/useOffers.js'
import { usePageTitle } from '../hooks/usePageTitle.js'
import { combine } from '../lib/query.js'

// Each section loads on its own and shows skeleton cards until its products arrive.
export default function Home() {
  usePageTitle()
  const bannersQuery = useBanners()
  const offersQuery = useOffers()
  const categoriesQuery = useCategories()
  const rowsQuery = useHomeRows()
  const all = [bannersQuery, offersQuery, categoriesQuery, rowsQuery]

  // Nothing could load at all: likely offline or the server is down.
  if (all.every((q) => q.isError)) return <ErrorState onRetry={combine(...all).refetch} />
  if (categoriesQuery.isLoading && bannersQuery.isLoading) return <HomeSkeleton />

  const categories = categoriesQuery.data ?? []
  const flat = categories.flatMap((p) => [p, ...p.children])
  const chosen = flat.filter((c) => c.featured)
  // Until categories are marked Featured in the admin, fall back to the configured list plus any with a picture.
  const picked = storefront.featuredCategorySlugs.map((slug) => flat.find((c) => c.slug === slug)).filter(Boolean)
  const featured = chosen.length ? chosen : [...picked, ...flat.filter((c) => c.image && !picked.includes(c))]

  const rows = rowsQuery.data
  const row = (title, key, seeAllTo, tag) => <ProductRow title={title} tag={tag} products={rows?.[key]} loading={rowsQuery.isLoading} seeAllTo={seeAllTo} />
  const categoryRows = categories.map((category) => (
    <ProductRow key={category.id} title={category.name} products={rows?.byCategory?.[category.slug]} loading={rowsQuery.isLoading} seeAllTo={`/category/${category.slug}`} />
  ))

  return (
    <div className="pb-10 lg:pb-[72px]">
      <HeroSection banners={bannersQuery.data} loading={bannersQuery.isLoading} />
      <TrustBadges />
      <FeaturedCategories categories={featured} />
      <FlashSale flashSale={offersQuery.data?.flashSale} loading={offersQuery.isLoading} />
      {row('Best Sellers', 'best-seller', '/shop?col=best-seller', 'HOT')}
      {row('New Arrivals', 'new-arrival', '/shop?col=new-arrival')}
      {row('Best Deals', 'best-deal', '/shop?col=best-deal')}
      {categoryRows.slice(0, 1)}
      <PromoBanners promos={bannersQuery.data?.promo} />
      {categoryRows.slice(1)}
    </div>
  )
}
