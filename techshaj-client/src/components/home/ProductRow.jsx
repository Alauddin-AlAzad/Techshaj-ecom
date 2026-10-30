import { Swiper, SwiperSlide } from 'swiper/react'
import { useSwiperNav } from '../../hooks/useSwiperNav.js'
import ProductCard from '../ProductCard.jsx'
import SectionHeader from './SectionHeader.jsx'

// Below lg: 162px cards scrolling to the screen edge (or a 2x2 grid when mobile="grid").
// From lg: 5 cards per view with the header arrows.
export default function ProductRow({ title, tag, products, seeAllTo, seeAllLabel, mobile = 'scroll' }) {
  const { swiperProps, nav } = useSwiperNav()
  if (!products?.length) return null

  return (
    <section className="site-container pt-7 lg:pt-12">
      <SectionHeader title={title} tag={tag} seeAllTo={seeAllTo} seeAllLabel={seeAllLabel} nav={products.length > 5 ? nav : null} />

      {mobile === 'grid' && (
        <div className="mt-3.5 grid grid-cols-2 gap-x-2.5 gap-y-4 lg:hidden">
          {products.slice(0, 4).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}

      <div className={mobile === 'grid' ? 'hidden lg:block' : undefined}>
        <ProductSwiper products={products} swiperProps={swiperProps} />
      </div>
    </section>
  )
}

export function ProductSwiper({ products, swiperProps, gap = 16, inset = true }) {
  return (
    <Swiper
      {...swiperProps}
      slidesPerView="auto"
      spaceBetween={10}
      slidesOffsetBefore={inset ? 16 : 0}
      slidesOffsetAfter={inset ? 16 : 0}
      breakpoints={{ 1024: { slidesPerView: 5, spaceBetween: gap, slidesOffsetBefore: 0, slidesOffsetAfter: 0 } }}
      className={inset ? 'mt-3.5 -mx-4 lg:mx-0 lg:mt-5' : undefined}
    >
      {products.map((p) => (
        <SwiperSlide key={p.id} className="max-lg:!w-[162px]">
          <ProductCard product={p} />
        </SwiperSlide>
      ))}
    </Swiper>
  )
}
