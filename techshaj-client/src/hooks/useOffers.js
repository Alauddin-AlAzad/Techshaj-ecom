import { useQuery } from '@tanstack/react-query'
import { pick } from '../lib/query.js'
import { useAxiosPublic } from './useAxiosPublic.js'

// Returns { coupons, flashSale }; flashSale is null when no sale is running.
export function useOffers() {
  const axiosPublic = useAxiosPublic()
  return pick(useQuery({ queryKey: ['offers'], queryFn: async () => (await axiosPublic.get('/offers')).data }))
}
