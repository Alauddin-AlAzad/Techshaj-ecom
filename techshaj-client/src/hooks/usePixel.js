import { useEffect } from 'react'
import { initPixel, trackingAllowed, trackPixel } from '../lib/pixel.js'

// Loads the Pixel from the Pixel ID saved in admin settings and reports every page view.
export function usePixel(pixelId, pathname) {
  useEffect(() => {
    if (!pixelId || !trackingAllowed()) return
    initPixel(pixelId)
    trackPixel('PageView')
  }, [pixelId, pathname])
}
