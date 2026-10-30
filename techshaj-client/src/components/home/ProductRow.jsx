import { Autoplay, Navigation } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import { useMediaQuery } from '../../hooks/useMediaQuery.js'
import { useSwiperNav } from '../../hooks/useSwiperNav.js'
import ProductCard from '../ProductCard.jsx'
import { ProductRowSkeleton } from '../Skeleton.jsx'
import SectionHeader from './SectionHeader.jsx'

// Cards per view: 2.2 on mobile, 3 on tablet, 5 from lg.
function useVisibleCards() {
  const tablet = useMediaQuery('(min-width: 768px)')
  const desktop = useMediaQuery('(min-width: 1024px)')
  return desktop ? 5 : tablet ? 3 : 2.2
}

// A titled Swiper row of product cards. Skeleton while loading, nothing when there are no products.
export default function ProductRow({ title, tag, products, loading = false, seeAllTo, seeAllLabel }) {
  const { swiperProps, nav } = useSwiperNav()
  const visible = useVisibleCards()
  if (loading) return <ProductRowSkeleton />
  if (!products?.length) return null

  return (
    <section className="site-container pt-7 lg:pt-12">
      <SectionHeader title={title} tag={tag} seeAllTo={seeAllTo} seeAllLabel={seeAllLabel} nav={products.length > visible ? nav : null} />
      <ProductSwiper products={products} swiperProps={swiperProps} className="mt-3.5 lg:mt-5" />
    </section>
  )
}

// Defined once so Swiper gets the same params on every render.
const AUTOPLAY = { delay: 2000, disableOnInteraction: false, pauseOnMouseEnter: true }
const MODULES = [Autoplay, Navigation]
const breakpoints = {}
const breakpointsFor = (gap) => (breakpoints[gap] ??= { 768: { slidesPerView: 3, spaceBetween: 14 }, 1024: { slidesPerView: 5, spaceBetween: gap } })
// Loop needs more slides than the widest view (5) plus a spare; shorter lists rewind instead.
const LOOP_MIN = 7

// Moves by itself every 2s. The loop/rewind choice depends only on the product count, so the slider is never re-created.
export function ProductSwiper({ products, swiperProps, gap = 16, className }) {
  const loop = products.length >= LOOP_MIN

  return (
    <Swiper
      modules={MODULES}
      {...swiperProps}
      autoplay={AUTOPLAY}
      speed={600}
      loop={loop}
      rewind={!loop}
      grabCursor
      slidesPerView={2.2}
      spaceBetween={10}
      breakpoints={breakpointsFor(gap)}
      className={className}
    >
      {products.map((p) => (
        <SwiperSlide key={p.id} className="h-auto!">
          <ProductCard product={p} />
        </SwiperSlide>
      ))}
    </Swiper>
  )
}
