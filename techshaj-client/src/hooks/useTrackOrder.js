import { useQuery } from '@tanstack/react-query'
import { isNotFound, pick } from '../lib/query.js'
import { useAxiosPublic } from './useAxiosPublic.js'

// Always resolves to an array of orders; a single order when an orderId is given.
export function useTrackOrder(query) {
  const axiosPublic = useAxiosPublic()
  return pick(
    useQuery({
      queryKey: ['track-order', query],
      queryFn: async () => {
        try {
          const params = query.id ? { phone: query.phone, orderId: query.id } : { phone: query.phone }
          const { data } = await axiosPublic.get('/orders/track', { params })
          return Array.isArray(data) ? data : [data]
        } catch (error) {
          if (isNotFound(error)) return []
          throw error
        }
      },
      enabled: Boolean(query),
      staleTime: 0,
    }),
  )
}
