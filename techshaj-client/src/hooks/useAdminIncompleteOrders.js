import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAxiosSecure } from './useAxiosSecure.js'

// filters: { status, page, limit } -> { orders, total, page, totalPages, counts: { new, called, ignored } }
export function useAdminIncompleteOrders(filters) {
  const axiosSecure = useAxiosSecure()
  return useQuery({
    queryKey: ['admin', 'incomplete-orders', filters],
    queryFn: async () => (await axiosSecure.get('/admin/incomplete-orders', { params: filters })).data,
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  })
}

export function useUpdateIncompleteOrder() {
  const axiosSecure = useAxiosSecure()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }) => (await axiosSecure.patch(`/admin/incomplete-orders/${id}`, { status })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'incomplete-orders'] }),
  })
}

export function useDeleteIncompleteOrder() {
  const axiosSecure = useAxiosSecure()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id) => (await axiosSecure.delete(`/admin/incomplete-orders/${id}`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'incomplete-orders'] }),
  })
}
