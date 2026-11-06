import { useQuery } from '@tanstack/react-query'
import { pick } from '../lib/query.js'
import { useStorefrontFetch } from './useStorefront.js'

// Returns { hero, side, promo, menu }.
export function useBanners() {
  const fetchStorefront = useStorefrontFetch()
  return pick(useQuery({ queryKey: ['banners'], queryFn: async () => (await fetchStorefront()).banners }))
}
