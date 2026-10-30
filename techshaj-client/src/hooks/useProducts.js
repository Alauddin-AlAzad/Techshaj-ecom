import { useQuery } from '@tanstack/react-query'
import { pick } from '../lib/query.js'
import { useAxiosPublic } from './useAxiosPublic.js'

// Server page size cap; the full catalog is fetched page by page.
const MAX_LIMIT = 100

// filters: { category, collection, minPrice, maxPrice, inStock, freeDelivery, search, sort, page, limit }
export const productsQuery = (axiosPublic, filters = {}) => ({
  queryKey: ['products', filters],
  queryFn: async () => (await axiosPublic.get('/products', { params: filters })).data,
})

// Returns { products, total, page, totalPages }.
export function useProducts(filters = {}) {
  const axiosPublic = useAxiosPublic()
  return pick(useQuery(productsQuery(axiosPublic, filters)))
}

// Every published product as one array. Shop filters, the cart, favorites and the footer share this cache.
export function useAllProducts() {
  const axiosPublic = useAxiosPublic()
  return pick(
    useQuery({
      queryKey: ['products', 'all'],
      queryFn: async () => {
        const fetchPage = async (page) => (await axiosPublic.get('/products', { params: { limit: MAX_LIMIT, page } })).data
        const first = await fetchPage(1)
        const rest = await Promise.all(Array.from({ length: Math.max(0, first.totalPages - 1) }, (_, i) => fetchPage(i + 2)))
        return [first, ...rest].flatMap((r) => r.products)
      },
    }),
  )
}
