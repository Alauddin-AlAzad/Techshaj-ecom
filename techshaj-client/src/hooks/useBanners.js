import { useQuery } from '@tanstack/react-query'
import { pick } from '../lib/query.js'
import { useAxiosPublic } from './useAxiosPublic.js'

// Returns { hero, side, promo, menu }.
export function useBanners() {
  const axiosPublic = useAxiosPublic()
  return pick(useQuery({ queryKey: ['banners'], queryFn: async () => (await axiosPublic.get('/banners')).data }))
}
