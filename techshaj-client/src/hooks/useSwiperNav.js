import { useCallback, useState } from 'react'

// Wires external prev/next buttons to a Swiper instance and tracks the ends.
export function useSwiperNav() {
  const [swiper, setSwiper] = useState(null)
  const [edges, setEdges] = useState({ atStart: true, atEnd: false })

  const sync = useCallback((s) => setEdges({ atStart: s.isBeginning, atEnd: s.isEnd }), [])

  return {
    swiperProps: {
      onSwiper: (s) => {
        setSwiper(s)
        sync(s)
      },
      onSlideChange: sync,
      onResize: sync,
      onBreakpoint: sync,
    },
    nav: { ...edges, prev: () => swiper?.slidePrev(), next: () => swiper?.slideNext() },
  }
}
