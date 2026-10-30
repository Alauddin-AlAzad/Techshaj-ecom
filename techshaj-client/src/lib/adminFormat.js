export { formatPrice } from './format.js'

const TIME_ZONE = 'Asia/Dhaka'

const date = new Intl.DateTimeFormat('en-GB', { timeZone: TIME_ZONE, day: 'numeric', month: 'short', year: 'numeric' })
const time = new Intl.DateTimeFormat('en-US', { timeZone: TIME_ZONE, hour: 'numeric', minute: '2-digit' })

// "30 Oct 2026", or "30 Oct 2026, 10:24 PM" with time, always in Dhaka time.
export function formatDate(value, { withTime = false } = {}) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return withTime ? `${date.format(d)}, ${time.format(d)}` : date.format(d)
}
