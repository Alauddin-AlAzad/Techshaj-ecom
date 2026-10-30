import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useFavoriteStore = create(
  persist(
    (set) => ({
      ids: [],
      toggle: (productId) =>
        set((state) => ({
          ids: state.ids.includes(productId) ? state.ids.filter((id) => id !== productId) : [...state.ids, productId],
        })),
    }),
    { name: 'techshaj-favorites' },
  ),
)

export const selectFavoriteCount = (state) => state.ids.length
