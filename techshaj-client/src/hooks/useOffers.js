import { useQuery } from '@tanstack/react-query'
import { pick } from '../lib/query.js'
import { useStorefrontFetch } from './useStorefront.js'

// Returns { coupons, flashSale }; flashSale is null when no sale is running.
export function useOffers() {
  const fetchStorefront = useStorefrontFetch()
  return pick(useQuery({ queryKey: ['offers'], queryFn: async () => (await fetchStorefront()).offers }))
}
