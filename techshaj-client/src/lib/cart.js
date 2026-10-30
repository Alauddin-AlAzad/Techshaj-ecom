import { formatPrice } from './format.js'

// Joins cart items with their products and works out the totals.
export function cartLines(items, products) {
  return items
    .map((item) => {
      const product = products.find((p) => p.id === item.productId)
      return product && { ...item, product }
    })
    .filter(Boolean)
}

export function cartTotals(lines, store) {
  const subtotal = lines.reduce((sum, l) => sum + l.product.price * l.qty, 0)
  const savings = lines.reduce((sum, l) => sum + Math.max(0, (l.product.oldPrice ?? 0) - l.product.price) * l.qty, 0)
  const threshold = store?.freeShippingThreshold ?? 0
  const allFreeDelivery = lines.length > 0 && lines.every((l) => l.product.freeDelivery)
  const freeShipping = allFreeDelivery || (threshold > 0 && subtotal >= threshold)
  return {
    count: lines.reduce((sum, l) => sum + l.qty, 0),
    subtotal,
    savings,
    allFreeDelivery,
    freeShipping,
    remaining: Math.max(0, threshold - subtotal),
    progress: freeShipping ? 1 : threshold ? subtotal / threshold : 0,
  }
}

export const variantLabel = (variant = {}) => Object.values(variant).join(' / ')

// Returns { discount } or { error } for a code against the store coupons.
export function applyCoupon(code, coupons, subtotal) {
  const coupon = coupons.find((c) => c.code.toLowerCase() === code.trim().toLowerCase())
  if (!coupon) return { error: 'Invalid coupon code' }
  if (subtotal < (coupon.minOrder ?? 0)) return { error: `Minimum order ${formatPrice(coupon.minOrder)} for this coupon` }
  const discount = coupon.type === 'percent' ? Math.round((subtotal * coupon.value) / 100) : coupon.value
  return { coupon, discount: Math.min(discount, subtotal) }
}
