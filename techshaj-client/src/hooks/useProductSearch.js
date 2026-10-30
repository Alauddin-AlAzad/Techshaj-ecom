import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useAxiosPublic } from './useAxiosPublic.js'

// Live header search: name and code matches from the server.
export function useProductSearch(query, limit = 5) {
  const axiosPublic = useAxiosPublic()
  const search = query.trim()
  const { data } = useQuery({
    queryKey: ['products', { search, limit }],
    queryFn: async () => (await axiosPublic.get('/products', { params: { search, limit } })).data,
    enabled: search.length > 0,
    placeholderData: keepPreviousData,
  })
  return search && data ? { total: data.total, results: data.products } : { total: 0, results: [] }
}
