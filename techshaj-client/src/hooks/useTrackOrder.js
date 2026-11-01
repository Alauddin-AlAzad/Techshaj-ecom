import { useQuery } from '@tanstack/react-query'
import { isNotFound, pick } from '../lib/query.js'
import { useAxiosPublic } from './useAxiosPublic.js'

// Needs both the order ID and the phone used at checkout; resolves to an array with that one order.
export function useTrackOrder(query) {
  const axiosPublic = useAxiosPublic()
  return pick(
    useQuery({
      queryKey: ['track-order', query],
      queryFn: async () => {
        try {
          const { data } = await axiosPublic.get('/orders/track', { params: { phone: query.phone, orderId: query.id } })
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
