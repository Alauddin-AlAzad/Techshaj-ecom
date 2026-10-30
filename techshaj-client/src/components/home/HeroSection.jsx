import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { Autoplay } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import { useSliderAutoplay } from '../../hooks/useSliderAutoplay.js'
import { cn } from '../../lib/cn.js'
import { Skeleton } from '../Skeleton.jsx'
import BannerImage from './BannerImage.jsx'

const arrow = 'absolute top-1/2 z-10 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-text shadow-md transition-transform hover:scale-105 lg:flex'

function Dots({ count, active, onSelect }) {
  if (count < 2) return null
  return (
    <div className="absolute inset-x-0 bottom-2.5 z-10 flex justify-center gap-1.5 lg:bottom-4">
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onSelect(i)}
          aria-label={`Go to slide ${i + 1}`}
          aria-current={i === active}
          className={cn('h-1.5 rounded-full shadow-sm transition-all', i === active ? 'w-[22px] bg-primary' : 'w-1.5 bg-white')}
        />
      ))}
    </div>
  )
}

function HeroSlider({ slides }) {
  const [swiper, setSwiper] = useState(null)
  const [active, setActive] = useState(0)
  const autoplay = useSliderAutoplay(4000)
  const many = slides.length > 1

  return (
    <div className="relative aspect-[2/1] min-w-0 overflow-hidden rounded-[14px] lg:flex-[3]">
      <Swiper
        modules={[Autoplay]}
        loop={many}
        {...(many ? autoplay : { autoplay: false })}
        onSwiper={setSwiper}
        onSlideChange={(s) => setActive(s.realIndex)}
        className="size-full"
      >
        {slides.map((b, i) => (
          <SwiperSlide key={b.id ?? b._id}>
            <BannerImage banner={b} eager={i === 0} className="size-full" />
          </SwiperSlide>
        ))}
      </Swiper>
      <Dots count={slides.length} active={active} onSelect={(i) => swiper?.slideToLoop(i)} />
      {many && (
        <>
          <button type="button" onClick={() => swiper?.slidePrev()} aria-label="Previous slide" className={cn(arrow, 'left-4')}>
            <ChevronLeft size={20} />
          </button>
          <button type="button" onClick={() => swiper?.slideNext()} aria-label="Next slide" className={cn(arrow, 'right-4')}>
            <ChevronRight size={20} />
          </button>
        </>
      )}
    </div>
  )
}

export function HeroSkeleton() {
  return (
    <div className="site-container flex flex-col gap-2.5 pt-3.5 lg:flex-row lg:gap-4 lg:pt-5">
      <Skeleton className="aspect-[2/1] rounded-[14px] lg:flex-[3]" />
      <div className="grid grid-cols-2 gap-2.5 lg:flex lg:flex-1 lg:flex-col lg:gap-4">
        <Skeleton className="aspect-[1.35/1] rounded-xl lg:aspect-auto lg:flex-1 lg:rounded-[14px]" />
        <Skeleton className="aspect-[1.35/1] rounded-xl lg:aspect-auto lg:flex-1 lg:rounded-[14px]" />
      </div>
    </div>
  )
}

// Image-only banners: the hero slider (about 2:1) with two side banners (about 1.35:1).
export default function HeroSection({ banners, loading = false }) {
  if (loading) return <HeroSkeleton />
  const slides = banners?.hero ?? []
  const side = (banners?.side ?? []).slice(0, 2)
  if (!slides.length && !side.length) return null

  return (
    <section className="site-container flex flex-col gap-2.5 pt-3.5 lg:flex-row lg:gap-4 lg:pt-5">
      {slides.length > 0 && <HeroSlider slides={slides} />}
      {side.length > 0 && (
        <div className={cn('grid grid-cols-2 gap-2.5 lg:flex lg:flex-col lg:gap-4', slides.length ? 'lg:flex-1' : 'lg:flex-row')}>
          {side.map((b) => (
            <BannerImage key={b.id ?? b._id} banner={b} className="aspect-[1.35/1] rounded-xl lg:flex-1 lg:rounded-[14px]" />
          ))}
        </div>
      )}
    </section>
  )
}
