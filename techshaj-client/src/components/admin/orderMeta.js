// Order statuses in flow order, and what an admin can move each one to (same rules as the server).
export const ORDER_STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']

export const STATUS_LABELS = { pending: 'Pending', confirmed: 'Confirmed', shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled' }

export const NEXT_STATUS = { pending: 'confirmed', confirmed: 'shipped', shipped: 'delivered' }

export const canCancel = (status) => status === 'pending' || status === 'confirmed'

export const PAYMENT_LABELS = { cod: 'Cash on Delivery', bkash: 'bKash', nagad: 'Nagad' }
export const PAYMENT_SHORT = { cod: 'COD', bkash: 'bKash', nagad: 'Nagad' }

export const itemCount = (order) => (order.items ?? []).reduce((sum, item) => sum + (item.quantity ?? 0), 0)

export const variantText = (variant) =>
  Object.entries(variant ?? {})
    .map(([k, v]) => `${k}: ${v}`)
    .join(', ')

// 01712345678 -> 8801712345678 for wa.me links.
export const whatsappNumber = (phone) => {
  const digits = String(phone ?? '').replace(/\D/g, '')
  return digits.startsWith('880') ? digits : `88${digits}`
}
