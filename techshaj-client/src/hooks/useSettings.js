import { useQuery } from '@tanstack/react-query'
import { pick } from '../lib/query.js'
import { useAxiosPublic } from './useAxiosPublic.js'

// Store info plus freeShippingThreshold and shippingZones (also as shipping.zones).
export function useSettings() {
  const axiosPublic = useAxiosPublic()
  return pick(useQuery({ queryKey: ['settings'], queryFn: async () => (await axiosPublic.get('/settings')).data }))
}
