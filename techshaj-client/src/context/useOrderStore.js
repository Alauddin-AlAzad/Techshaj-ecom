import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Orders placed from this browser. Customers have no login, so this is their order history.
export const useOrderStore = create(
  persist(
    (set) => ({
      orders: [],
      lastOrderId: null,
      addOrder: (order) => set((state) => ({ orders: [order, ...state.orders], lastOrderId: order.id })),
    }),
    { name: 'techshaj-orders' },
  ),
)
