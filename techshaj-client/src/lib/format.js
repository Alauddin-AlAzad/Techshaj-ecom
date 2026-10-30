const bdt = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })

export function formatPrice(amount) {
  return `৳${bdt.format(amount)}`
}

// 170 -> "170+", 1450 -> "1.4k+"
export function formatSold(count) {
  if (count >= 1000) return `${Math.floor(count / 100) / 10}k+`
  if (count >= 10) return `${Math.floor(count / 10) * 10}+`
  return String(count)
}

export function shouldShowRating(product) {
  return product.reviewCount >= 3
}

export function discountPercent(price, oldPrice) {
  if (!oldPrice || oldPrice <= price) return 0
  return Math.round(((oldPrice - price) / oldPrice) * 100)
}

const banglaDigits = '০১২৩৪৫৬৭৮৯'

export function toBanglaDigits(value) {
  return String(value).replace(/\d/g, (d) => banglaDigits[d])
}

export function toLatinDigits(value) {
  return String(value).replace(/[০-৯]/g, (d) => banglaDigits.indexOf(d))
}

// "30 Oct 2026"
export function formatDate(value) {
  return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

// "30 Oct, 10:24 AM"
export function formatDateTime(value) {
  const d = new Date(value)
  const day = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  return `${day}, ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
}
