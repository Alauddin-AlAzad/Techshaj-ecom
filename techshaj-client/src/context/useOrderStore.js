import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Summary of the last order placed from this browser, for the Order Success page.
export const useOrderStore = create(
  persist(
    (set) => ({
      lastOrder: null,
      setLastOrder: (order) => set({ lastOrder: order }),
    }),
    { name: 'techshaj-last-order' },
  ),
)
