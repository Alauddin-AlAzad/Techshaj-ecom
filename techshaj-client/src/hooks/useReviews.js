import { useQuery } from '@tanstack/react-query'
import { pick } from '../lib/query.js'
import { useAxiosPublic } from './useAxiosPublic.js'

export function useReviews(productId) {
  const axiosPublic = useAxiosPublic()
  return pick(
    useQuery({
      queryKey: ['reviews', productId],
      queryFn: async () => (await axiosPublic.get('/reviews', { params: { productId } })).data,
      select: (reviews) => reviews.map((r) => ({ ...r, date: r.date ?? r.createdAt })),
      enabled: productId != null,
    }),
  )
}
