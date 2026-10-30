import { useMediaQuery } from './useMediaQuery.js'

// Swiper props for autoplay that pauses on hover and while a finger is down; off for reduced motion.
export function useSliderAutoplay(delay) {
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)')
  if (reduced) return { autoplay: false }
  return {
    autoplay: { delay, disableOnInteraction: false, pauseOnMouseEnter: true },
    onTouchStart: (s) => s.autoplay?.pause(),
    onTouchEnd: (s) => s.autoplay?.resume(),
  }
}
