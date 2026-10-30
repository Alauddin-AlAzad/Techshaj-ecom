import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAxiosSecure } from './useAxiosSecure.js'

// filters: { status, page, limit } -> { reviews (each with product { id, name, slug }), total, page, totalPages }
export function useAdminReviews(filters) {
  const axiosSecure = useAxiosSecure()
  return useQuery({
    queryKey: ['admin', 'reviews', filters],
    queryFn: async () => (await axiosSecure.get('/admin/reviews', { params: filters })).data,
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  })
}

// { id, status: 'approved' | 'rejected' }. The server recalculates the product rating.
export function useModerateReview() {
  const axiosSecure = useAxiosSecure()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }) => (await axiosSecure.patch(`/admin/reviews/${id}`, { status })).data,
    onSuccess: () => {
      for (const queryKey of [['admin', 'reviews'], ['reviews'], ['product'], ['products'], ['admin', 'products']]) queryClient.invalidateQueries({ queryKey })
    },
  })
}
