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
