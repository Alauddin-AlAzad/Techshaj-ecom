import { useQuery } from '@tanstack/react-query'
import { isNotFound, pick } from '../lib/query.js'
import { useAxiosPublic } from './useAxiosPublic.js'

// The product with its category and parentCategory; data is null when the slug does not exist.
export function useProduct(slug) {
  const axiosPublic = useAxiosPublic()
  return pick(
    useQuery({
      queryKey: ['product', slug],
      queryFn: async () => {
        try {
          return (await axiosPublic.get(`/products/${encodeURIComponent(slug)}`)).data
        } catch (error) {
          if (isNotFound(error)) return null
          throw error
        }
      },
      enabled: Boolean(slug),
    }),
  )
}
