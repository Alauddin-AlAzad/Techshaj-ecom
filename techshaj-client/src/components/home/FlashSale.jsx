import { ChevronLeft, ChevronRight, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import FlashCountdown from '../FlashCountdown.jsx'
import { useSwiperNav } from '../../hooks/useSwiperNav.js'
import { ProductCardsSkeleton, Skeleton } from '../Skeleton.jsx'
import { ProductSwiper } from './ProductRow.jsx'

const arrow = 'absolute top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-primary shadow-md hover:bg-primary-tint max-lg:hidden'

export default function FlashSale({ flashSale, loading = false }) {
  const { swiperProps, nav } = useSwiperNav()
  if (loading) {
    return (
      <section role="status" aria-label="Loading" className="site-container pt-7 lg:pt-12">
        <div className="overflow-hidden rounded-[14px] border border-nav-line">
          <Skeleton className="h-[64px] rounded-none lg:h-[80px]" />
          <div className="p-3 lg:p-5">
            <ProductCardsSkeleton />
          </div>
        </div>
      </section>
    )
  }
  if (!flashSale?.products?.length) return null

  return (
    <section className="site-container pt-7 lg:pt-12">
      <div className="relative overflow-hidden rounded-[14px] bg-flash bg-[radial-gradient(circle_at_88%_0%,color-mix(in_srgb,var(--color-primary)_50%,transparent),transparent_55%),radial-gradient(circle_at_0%_100%,color-mix(in_srgb,var(--color-secondary)_40%,transparent),transparent_50%)] px-3 pt-4 pb-4 lg:px-5 lg:pt-5 lg:pb-6">
        {flashSale.bannerImage && (
          <>
            <picture>
              {flashSale.bannerMobile && <source media="(max-width: 1023px)" srcSet={flashSale.bannerMobile} />}
              <img src={flashSale.bannerImage} alt="" className="absolute inset-0 size-full object-cover" />
            </picture>
            <div className="absolute inset-0 bg-flash/55" />
          </>
        )}
        <div className="relative flex items-center gap-1.5 lg:gap-x-4">
          <h2 className="flex shrink-0 items-center gap-1 font-heading text-[14px] font-bold text-white lg:gap-2 lg:text-[28px]">
            <Zap className="size-4 fill-highlight text-highlight lg:size-7" />
            {flashSale.title}
          </h2>
          <div className="flex items-center gap-1.5 lg:gap-2">
            <span className="text-[10px] leading-tight font-semibold text-white lg:text-[14px]">Ends in</span>
            <FlashCountdown endsAt={flashSale.endsAt} />
          </div>
          <Link to="/offers?tab=flash-sale" className="ml-auto flex h-7 shrink-0 items-center rounded-md border border-white px-2 text-[11px] font-semibold text-white hover:bg-white/10 lg:h-9 lg:rounded-lg lg:px-4 lg:text-[14px]">
            See All
          </Link>
        </div>
        <div className="relative mt-3.5 lg:mt-5">
          {flashSale.products.length > 5 && (
            <>
              <button type="button" onClick={nav.prev} aria-label="Previous" className={`${arrow} -left-3`}>
                <ChevronLeft size={20} />
              </button>
              <button type="button" onClick={nav.next} aria-label="Next" className={`${arrow} -right-3`}>
                <ChevronRight size={20} />
              </button>
            </>
          )}
          <ProductSwiper products={flashSale.products} swiperProps={swiperProps} gap={14} variant="flash" />
        </div>
      </div>
    </section>
  )
}
