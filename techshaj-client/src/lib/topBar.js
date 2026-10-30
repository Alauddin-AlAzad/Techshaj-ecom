import { formatPrice } from './format.js'

export const TOP_BAR_SPEEDS = [
  { value: 'slow', label: 'Slow', seconds: 12 },
  { value: 'normal', label: 'Normal', seconds: 8 },
  { value: 'fast', label: 'Fast', seconds: 5 },
]

const legacyFreeShipping = /free (shipping|delivery)/i

// Saved topBar, or one built from the older announcements list.
export function topBarOf(settings) {
  if (settings?.topBar) return settings.topBar
  const messages = (settings?.announcements ?? []).filter((text) => !legacyFreeShipping.test(text)).map((text) => ({ text, link: '' }))
  return { enabled: true, speed: 'normal', messages, left: [], right: [] }
}

export function freeDeliveryMessage(threshold) {
  return Number(threshold) > 0 ? `Free delivery on orders over ${formatPrice(Number(threshold))}` : null
}

// Every marquee message: the free delivery one first, then the admin's.
export function marqueeMessages(topBar, threshold) {
  const auto = freeDeliveryMessage(threshold)
  return [...(auto ? [{ text: auto, link: '' }] : []), ...(topBar?.messages ?? []).filter((m) => m.text?.trim())]
}
