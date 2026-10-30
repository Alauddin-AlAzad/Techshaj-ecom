import 'swiper/css'
import CategoryChips from '../components/home/CategoryChips.jsx'
import FeaturedCategories from '../components/home/FeaturedCategories.jsx'
import FlashSale from '../components/home/FlashSale.jsx'
import HeroSection from '../components/home/HeroSection.jsx'
import ProductRow from '../components/home/ProductRow.jsx'
import PromoBanners from '../components/home/PromoBanners.jsx'
import TrustBadges from '../components/home/TrustBadges.jsx'
import { HomeSkeleton } from '../components/Skeleton.jsx'
import { getBanners, getCategories, getFeaturedCategories, getOffers, getProducts } from '../data/api.js'
import { useAsync } from '../hooks/useAsync.js'
import { usePageTitle } from '../hooks/usePageTitle.js'

async function loadCategoryRows() {
  const parents = await getCategories()
  const rows = await Promise.all(parents.map((c) => getProducts({ category: c.slug })))
  return parents.map((c, i) => ({ category: c, products: rows[i] }))
}

// Everything loads together so the page swaps from the skeleton in one step.
async function loadHome() {
  const [banners, featured, offers, bestDeals, bestSellers, categoryRows] = await Promise.all([
    getBanners(),
    getFeaturedCategories(),
    getOffers(),
    getProducts({ collection: 'best-deal' }),
    getProducts({ collection: 'best-seller' }),
    loadCategoryRows(),
  ])
  return { banners, featured, offers, bestDeals, bestSellers, categoryRows }
}

export default function Home() {
  usePageTitle()
  const data = useAsync(loadHome)
  if (!data) return <HomeSkeleton />
  const { banners, featured, offers, bestDeals, bestSellers, categoryRows } = data

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
