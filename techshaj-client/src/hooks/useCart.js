import { useMemo } from 'react'
import { useCartStore } from '../context/useCartStore.js'
import { getProductsByIds, getStore } from '../data/api.js'
import { cartLines, cartTotals } from '../lib/cart.js'
import { useAsync } from './useAsync.js'

// Cart items joined with product data, plus totals. `ready` is false until products load.
export function useCart() {
  const items = useCartStore((s) => s.items)
  const idKey = [...new Set(items.map((i) => i.productId))].join(',')
  const data = useAsync(
    () => Promise.all([getProductsByIds(idKey ? idKey.split(',').map(Number) : [], { instant: true }), getStore()]),
    [idKey],
  )

  return useMemo(() => {
    const [products = [], store = null] = data ?? []
    const lines = cartLines(items, products)
    return { ready: Boolean(data), store, lines, ...cartTotals(lines, store) }
  }, [items, data])
}
