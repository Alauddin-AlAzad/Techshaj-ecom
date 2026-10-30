import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Autoplay } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import { cn } from '../../lib/cn.js'
import CategoryIcon from '../CategoryIcon.jsx'
import { bannerThemes } from './bannerThemes.js'

function Dots({ count, active, onSelect, className }) {
  if (count < 2) return null
  return (
    <div className={cn('flex gap-1.5', className)}>
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onSelect(i)}
          aria-label={`Go to slide ${i + 1}`}
          aria-current={i === active}
          className={cn('h-1 rounded-sm transition-all', i === active ? 'w-[22px] bg-primary' : 'w-2 bg-primary-soft')}
        />
      ))}
    </div>
  )
}

function MainSlide({ banner, dots }) {
  const theme = bannerThemes[banner.theme] ?? bannerThemes.blue
  return (
    <div className={cn('relative flex h-[180px] items-center overflow-hidden pl-5 lg:h-[380px] lg:justify-between lg:px-14', theme.bg)}>
      <div className="relative z-10 flex flex-col items-start gap-2.5 lg:w-[460px] lg:gap-3.5">
        <span className={cn('rounded-[14px] bg-white px-[9px] py-1 text-[10px] font-bold tracking-[0.6px] lg:rounded-[20px] lg:px-3 lg:py-1.5 lg:text-[12px] lg:tracking-[0.72px]', theme.eyebrow)}>
          {banner.eyebrow}
        </span>
        <h2 className="max-w-[190px] font-heading text-[22px] font-bold text-hero-ink lg:hidden">{banner.title.replace('\n', ' ')}</h2>
        <h2 className="hidden font-heading text-[46px] leading-[50px] font-bold tracking-[-0.69px] whitespace-pre-line text-hero-ink lg:block">{banner.title}</h2>
        {banner.subtitle && <p className="hidden w-[440px] text-body-lg text-hero-copy lg:block">{banner.subtitle}</p>}
        <Link to={banner.link} className="flex h-9 items-center gap-1.5 rounded-[20px] bg-dark px-3.5 text-[13px] font-bold text-white lg:h-12 lg:gap-2 lg:rounded-3xl lg:px-[26px] lg:text-[15px]">
          Shop Now
          <ArrowRight className="size-[15px] lg:size-[18px]" />
        </Link>
        <div className="hidden pt-3.5 lg:block">{dots}</div>
      </div>
      <div className="absolute top-5 -right-3 flex size-[140px] shrink-0 items-center justify-center rounded-full bg-white lg:static lg:size-[290px]">
        <CategoryIcon name={banner.icon} absoluteStrokeWidth className={cn('size-[66px] lg:size-[140px]', theme.icon)} />
      </div>
    </div>
  )
}

function SideBanner({ banner }) {
  const theme = bannerThemes[banner.theme] ?? bannerThemes.pink
  return (
    <Link
      to={banner.link}
      className={cn('flex h-[90px] min-w-0 flex-1 items-center justify-between rounded-xl pr-3 pl-3.5 lg:h-[182px] lg:w-full lg:flex-none lg:rounded-[14px] lg:pr-6 lg:pl-7', theme.bg)}
    >
      <p className="text-[14px] leading-[18px] font-extrabold whitespace-pre-line text-text lg:hidden">{banner.shortTitle ?? banner.title}</p>
      <div className="hidden flex-col items-start gap-2 lg:flex">
        <span className={cn('text-[12px] font-bold tracking-[0.72px]', theme.eyebrow)}>{banner.eyebrow}</span>
        <p className="font-heading text-h3 whitespace-pre-line text-text">{banner.title}</p>
        <span className="flex items-center gap-1 text-label text-text">
          Shop now
          <ArrowRight size={16} />
        </span>
      </div>
      <span className="flex size-[46px] shrink-0 items-center justify-center rounded-full bg-white lg:size-[110px]">
        <CategoryIcon name={banner.icon} className={cn('size-[22px] lg:size-[54px]', theme.icon)} />
      </span>
    </Link>
  )
}

export default function HeroSection({ banners }) {
  const [swiper, setSwiper] = useState(null)
  const [active, setActive] = useState(0)
  const slides = banners?.hero ?? []
  if (!slides.length) return null

  const dots = <Dots count={slides.length} active={active} onSelect={(i) => swiper?.slideToLoop(i)} />

  return (
    <section className="site-container flex flex-col gap-2.5 pt-3.5 lg:flex-row lg:gap-4 lg:pt-5">
      <div className="group relative min-w-0 overflow-hidden rounded-[14px] lg:flex-[2]">
        <Swiper
          modules={[Autoplay]}
          loop={slides.length > 1}
          autoplay={{ delay: 5000, disableOnInteraction: false, pauseOnMouseEnter: true }}
          onSwiper={setSwiper}
          onSlideChange={(s) => setActive(s.realIndex)}
        >
          {slides.map((b) => (
            <SwiperSlide key={b.id}>
              <MainSlide banner={b} dots={dots} />
            </SwiperSlide>
          ))}
        </Swiper>
        <Dots count={slides.length} active={active} onSelect={(i) => swiper?.slideToLoop(i)} className="absolute bottom-3 left-5 z-10 lg:hidden" />
        {slides.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => swiper?.slidePrev()}
              aria-label="Previous slide"
              className="absolute top-1/2 left-4 z-10 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white text-text opacity-0 shadow-md transition-opacity group-hover:opacity-100 focus-visible:opacity-100 lg:flex"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => swiper?.slideNext()}
              aria-label="Next slide"
              className="absolute top-1/2 right-4 z-10 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white text-text opacity-0 shadow-md transition-opacity group-hover:opacity-100 focus-visible:opacity-100 lg:flex"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}
      </div>
      <div className="flex gap-2.5 lg:flex-1 lg:flex-col lg:gap-4">
        {banners.side.map((b) => (
          <SideBanner key={b.id} banner={b} />
        ))}
      </div>
    </section>
  )
}
