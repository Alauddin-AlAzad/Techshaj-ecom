import { useQuery } from '@tanstack/react-query'
import { isNotFound, pick } from '../lib/query.js'
import { useAxiosPublic } from './useAxiosPublic.js'

export function useRelatedProducts(slug) {
  const axiosPublic = useAxiosPublic()
  return pick(
    useQuery({
      queryKey: ['product', slug, 'related'],
      queryFn: async () => {
        try {
          return (await axiosPublic.get(`/products/${encodeURIComponent(slug)}/related`)).data
        } catch (error) {
          if (isNotFound(error)) return []
          throw error
        }
      },
      enabled: Boolean(slug),
    }),
  )
}
