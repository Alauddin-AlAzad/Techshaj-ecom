const STEPS = [
  { key: 'order-placed', label: 'Order placed' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'out-for-delivery', label: 'Out for delivery' },
  { key: 'delivered', label: 'Delivered' },
]

// Server statuses -> timeline step keys. A new order is "pending" on the server.
const stepKey = (status) => (status === 'pending' || status === 'placed' ? 'order-placed' : status)

// Turns an /orders/track result into the shape the tracking UI uses.
export function normalizeOrder(order, zones = []) {
  const history = order.statusHistory ?? []
  const status = order.status === 'pending' ? 'placed' : order.status
  // A cancelled order keeps the steps it reached before cancelling.
  const reached = Math.max(0, ...history.map((h) => STEPS.findIndex((s) => s.key === stepKey(h.status))), STEPS.findIndex((s) => s.key === stepKey(status)))
  const dateOf = (key) => history.findLast((h) => stepKey(h.status) === key)?.at ?? (key === 'order-placed' ? order.createdAt : null)
  const courier = order.courier || order.trackingNumber ? order.courier ?? {} : null

  return {
    id: order.orderId,
    status,
    placedAt: order.createdAt,
    shippingZoneId: zones.find((z) => z.name === order.area)?.id ?? null,
    items: (order.items ?? []).map((i) => ({ ...i, qty: i.quantity ?? i.qty })),
    subtotal: order.subtotal,
    shipping: order.shipping,
    discount: order.discount,
    total: order.total,
    steps: STEPS.map((s, i) => ({ ...s, done: i <= reached, date: i <= reached ? dateOf(s.key) : null })),
    courier: courier && {
      name: typeof courier === 'string' ? courier : (courier.name ?? 'Courier'),
      trackingId: order.trackingNumber ?? courier.trackingId ?? null,
      trackingUrl: courier.trackingUrl ?? null,
    },
  }
}

export const itemCount = (order) => order.items.reduce((sum, i) => sum + i.qty, 0)

export const PAYMENT_LABELS = { cod: 'Cash on Delivery', bkash: 'bKash', nagad: 'Nagad' }

export const STATUS_LABELS = {
  placed: 'Order Placed',
  confirmed: 'Confirmed',
  shipped: 'Shipped',
  'out-for-delivery': 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

// Latest possible delivery date from the zone's "2-4 days".
export function expectedDelivery(order, zones) {
  const days = zones.find((z) => z.id === order.shippingZoneId)?.days ?? ''
  const max = Number(days.match(/(\d+)\s*days/)?.[1] ?? 4)
  const date = new Date(order.placedAt)
  date.setDate(date.getDate() + max)
  return date
}
