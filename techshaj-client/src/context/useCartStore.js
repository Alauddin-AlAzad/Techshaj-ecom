import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const itemKey = (productId, variant = {}) => `${productId}:${JSON.stringify(variant)}`

export const useCartStore = create(
  persist(
    (set) => ({
      items: [],
      addItem: (productId, qty = 1, variant = {}) =>
        set((state) => {
          const key = itemKey(productId, variant)
          const existing = state.items.find((i) => i.key === key)
          if (existing) {
            return { items: state.items.map((i) => (i.key === key ? { ...i, qty: i.qty + qty } : i)) }
          }
          return { items: [...state.items, { key, productId, qty, variant }] }
        }),
      updateQty: (key, qty) =>
        set((state) => ({
          items: qty > 0 ? state.items.map((i) => (i.key === key ? { ...i, qty } : i)) : state.items.filter((i) => i.key !== key),
        })),
      removeItem: (key) => set((state) => ({ items: state.items.filter((i) => i.key !== key) })),
      clear: () => set({ items: [] }),
    }),
    { name: 'techshaj-cart' },
  ),
)

export const selectCartCount = (state) => state.items.reduce((sum, i) => sum + i.qty, 0)
