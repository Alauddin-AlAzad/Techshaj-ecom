import { useMemo } from 'react'
import { useCartStore } from '../context/useCartStore.js'
import { cartLines, cartTotals } from '../lib/cart.js'
import { combine } from '../lib/query.js'
import { useAllProducts } from './useProducts.js'
import { useSettings } from './useSettings.js'

// Cart items (or the single Order Now item) joined with product data, plus totals. `ready` is false until products and settings load.
export function useCart({ buyNow = false } = {}) {
  const cartItems = useCartStore((s) => s.items)
  const buyNowItem = useCartStore((s) => s.buyNow)
  const items = useMemo(() => (buyNow ? (buyNowItem ? [buyNowItem] : []) : cartItems), [buyNow, buyNowItem, cartItems])
  const products = useAllProducts()
  const settings = useSettings()
  const { isError, refetch } = combine(products, settings)

  return useMemo(() => {
    const store = settings.data ?? null
    const lines = cartLines(items, products.data ?? [])
    return { ready: Boolean(products.data && settings.data), isError, refetch, store, lines, ...cartTotals(lines, store) }
  }, [items, products.data, settings.data, isError, refetch])
}
