import { ChevronLeft, ChevronRight, Zap } from 'lucide-react'
import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import { useCountdown } from '../../hooks/useCountdown.js'
import { useSwiperNav } from '../../hooks/useSwiperNav.js'
import { ProductCardsSkeleton, Skeleton } from '../Skeleton.jsx'
import { ProductSwiper } from './ProductRow.jsx'

function Countdown({ endsAt }) {
  const t = useCountdown(endsAt)
  const hours = String(Number(t.days) * 24 + Number(t.hours)).padStart(2, '0')
  const units = [hours, t.mins, t.secs]

  return (
    <div role="timer" aria-label="Time left in flash sale" className="flex items-center gap-1 lg:gap-1.5">
      {units.map((value, i) => (
        <Fragment key={i}>
          {i > 0 && <span className="text-[14px] font-bold text-white lg:text-[16px]">:</span>}
          <span className="flex h-7 min-w-8 items-center justify-center rounded-md bg-primary-tint px-1.5 text-[14px] font-bold text-primary tabular-nums lg:h-9 lg:min-w-[42px] lg:text-[18px]">{value}</span>
        </Fragment>
      ))}
    </div>
  )
}

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
        <div className="relative flex flex-wrap items-center gap-x-3 gap-y-2.5 lg:gap-x-4">
          <h2 className="flex items-center gap-1.5 font-heading text-[18px] font-bold text-white lg:gap-2 lg:text-[28px]">
            <Zap className="size-5 fill-highlight text-highlight lg:size-7" />
            {flashSale.title}
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-semibold text-white lg:text-[14px]">Ends in</span>
            <Countdown endsAt={flashSale.endsAt} />
          </div>
          <Link to="/offers?tab=flash-sale" className="ml-auto flex h-8 items-center rounded-lg border border-white px-3 text-[12px] font-semibold text-white hover:bg-white/10 lg:h-9 lg:px-4 lg:text-[14px]">
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
