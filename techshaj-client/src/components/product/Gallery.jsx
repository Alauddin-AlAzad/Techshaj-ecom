import { Heart } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { useFavoriteToggle } from '../../hooks/useFavoriteToggle.js'
import { cn } from '../../lib/cn.js'

// Desktop: zooms 2x under the cursor while hovering.
function ZoomImage({ src, alt, lazy }) {
  const [origin, setOrigin] = useState('50% 50%')
  return (
    <div
      className="group size-full overflow-hidden"
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect()
        setOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`)
      }}
    >
      <img
        src={src}
        alt={alt}
        loading={lazy ? 'lazy' : undefined}
        decoding="async"
        style={{ transformOrigin: origin }}
        className="size-full object-contain mix-blend-multiply transition-transform duration-200 lg:group-hover:scale-200"
      />
    </div>
  )
}

function Thumb({ src, active, onClick, index }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Show image ${index + 1}`}
      aria-current={active}
      className={cn('size-16 shrink-0 overflow-hidden rounded-lg bg-fill lg:size-[72px]', active ? 'border-2 border-primary' : 'border-2 border-transparent hover:border-primary-soft')}
    >
      <img src={src} alt="" loading="lazy" decoding="async" className="size-full object-contain mix-blend-multiply" />
    </button>
  )
}

// Figma: desktop thumbs on the left + "1 / 6" counter (28:3326), mobile dots + thumbs below (30:3626).
// focus: { src } of an option picture to show; onThumb(src) runs when a thumb is clicked.
export default function Gallery({ product, discount, focus, onThumb }) {
  const [swiper, setSwiper] = useState(null)
  const [active, setActive] = useState(0)
  const [isFavorite, toggleFavorite] = useFavoriteToggle(product)
  // Option pictures that are not in the gallery are added after it.
  const optionSrcs = Object.values(product.optionImages ?? {}).flatMap((options) => Object.values(options))
  const images = [...new Set([...product.images, ...optionSrcs])]
  const thumbs = images.map((src, i) => (
    <Thumb
      key={i}
      src={src}
      index={i}
      active={i === active}
      onClick={() => {
        swiper?.slideTo(i)
        onThumb?.(src)
      }}
    />
  ))

  useEffect(() => {
    const index = focus ? images.indexOf(focus.src) : -1
    if (swiper && index >= 0) swiper.slideTo(index)
  }, [focus, swiper]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col gap-2.5 lg:contents">
      <div className="no-scrollbar order-2 flex gap-2 overflow-x-auto lg:order-none lg:flex-col lg:gap-2.5 lg:overflow-visible">{thumbs}</div>

      <div className="relative aspect-square w-full overflow-hidden rounded-[14px] bg-fill">
        <Swiper onSwiper={setSwiper} onSlideChange={(s) => setActive(s.activeIndex)} className="size-full">
          {images.map((src, i) => (
            <SwiperSlide key={i}>
              <ZoomImage src={src} alt={`${product.name}, image ${i + 1} of ${images.length}`} lazy={i > 0} />
            </SwiperSlide>
          ))}
        </Swiper>

        {discount > 0 && (
          <span className="absolute top-3 left-3 z-10 rounded-md bg-secondary px-2 py-1 text-[11px] font-bold text-white lg:hidden">{discount}% OFF</span>
        )}
        <button
          type="button"
          onClick={toggleFavorite}
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          aria-pressed={isFavorite}
          className="absolute top-3 right-3 z-10 flex size-9 items-center justify-center rounded-full bg-white text-text lg:top-4 lg:right-4 lg:size-10"
        >
          <Heart className={cn('size-[17px] lg:size-[19px]', isFavorite && 'fill-primary text-primary')} />
        </button>
        <span className="absolute bottom-6 left-4 z-10 hidden rounded-xl bg-white px-2.5 py-[5px] text-label-sm text-text lg:block">
          {active + 1} / {images.length}
        </span>
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-[5px] lg:hidden">
            {images.map((_, i) => (
              <span key={i} className={cn('h-1.5 rounded-[3px]', i === active ? 'w-[18px] bg-text' : 'w-1.5 bg-check-line')} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
