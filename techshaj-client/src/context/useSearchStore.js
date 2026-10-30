import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useSearchStore = create(
  persist(
    (set) => ({
      recent: [],
      addRecent: (query) =>
        set((state) => {
          const q = query.trim().toLowerCase()
          if (!q) return state
          return { recent: [q, ...state.recent.filter((r) => r !== q)].slice(0, 6) }
        }),
      clearRecent: () => set({ recent: [] }),
    }),
    { name: 'techshaj-recent-searches' },
  ),
)
