import { useQuery } from '@tanstack/react-query'
import { brandingOf } from '../lib/branding.js'
import { pick } from '../lib/query.js'
import { useAxiosPublic } from './useAxiosPublic.js'

const FIVE_MINUTES = 5 * 60 * 1000

// Store info plus freeShippingThreshold and shippingZones (also as shipping.zones).
export function useSettings() {
  const axiosPublic = useAxiosPublic()
  return pick(useQuery({ queryKey: ['settings'], queryFn: async () => (await axiosPublic.get('/settings')).data, staleTime: FIVE_MINUTES }))
}

// { name, logoUrl, faviconUrl }: the built-in name while loading or when nothing is saved.
export function useBranding() {
  const { data } = useSettings()
  return brandingOf(data)
}
