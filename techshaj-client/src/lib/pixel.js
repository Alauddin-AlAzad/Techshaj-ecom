const NO_TRACK_KEY = 'ts_no_track'

// No tracking on admin pages or in the store owner's browser (flagged at admin login).
export function trackingAllowed() {
  if (window.location.pathname.startsWith('/admin')) return false
  try {
    return localStorage.getItem(NO_TRACK_KEY) !== '1'
  } catch {
    return true
  }
}

export function disableTracking() {
  try {
    localStorage.setItem(NO_TRACK_KEY, '1')
  } catch {
    // Private mode: admin pages are still excluded by path.
  }
}

function load() {
  if (window.fbq) return
  const fbq = function (...args) {
    if (fbq.callMethod) fbq.callMethod(...args)
    else fbq.queue.push(args)
  }
  window.fbq = fbq
  window._fbq = fbq
  fbq.push = fbq
  fbq.loaded = true
  fbq.version = '2.0'
  fbq.queue = []
  // Page views are sent by usePixel; without this the Pixel also counts history changes, including into /admin.
  fbq.disablePushState = true
  const script = document.createElement('script')
  script.async = true
  script.src = 'https://connect.facebook.net/en_US/fbevents.js'
  document.head.appendChild(script)
}

let initialized = null

export function initPixel(pixelId) {
  if (!trackingAllowed()) return false
  if (!pixelId || initialized === pixelId) return false
  load()
  window.fbq('init', pixelId)
  initialized = pixelId
  return true
}

export function trackPixel(name, data, eventId) {
  if (!trackingAllowed()) return
  if (!initialized || !window.fbq) return
  if (eventId) window.fbq('track', name, data, { eventID: eventId })
  else window.fbq('track', name, data)
}

export const newEventId = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`)

const cookie = (name) => document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))?.[1] ?? ''

// Browser ids Meta uses to match a server event to the same visitor.
export function metaBrowserIds() {
  const fbclid = new URLSearchParams(window.location.search).get('fbclid')
  return { fbp: cookie('_fbp'), fbc: cookie('_fbc') || (fbclid ? `fb.1.${Date.now()}.${fbclid}` : '') }
}

// Same product ids the server sends, so browser and server events line up.
export const pixelContents = (items, value) => ({
  value,
  currency: 'BDT',
  content_type: 'product',
  content_ids: items.map((i) => String(i.id)),
  contents: items.map((i) => ({ id: String(i.id), quantity: i.qty ?? 1, item_price: i.price })),
  num_items: items.reduce((sum, i) => sum + (i.qty ?? 1), 0),
})
