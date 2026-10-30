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

const inputParts = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })

// Date -> "2026-10-30T22:24" for <input type="datetime-local">, in Dhaka time.
export function toDhakaInput(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const p = Object.fromEntries(inputParts.formatToParts(d).map((part) => [part.type, part.value]))
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`
}

// "2026-10-30T22:24" (Dhaka time) -> ISO string; empty -> null.
export const fromDhakaInput = (text) => (text ? new Date(`${text}:00+06:00`).toISOString() : null)
