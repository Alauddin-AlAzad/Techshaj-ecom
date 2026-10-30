import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAxiosSecure } from './useAxiosSecure.js'

// filters: { status, search, page, limit } -> { orders, total, counts, page, totalPages }
export function useAdminOrders(filters) {
  const axiosSecure = useAxiosSecure()
  return useQuery({
    queryKey: ['admin', 'orders', 'list', filters],
    queryFn: async () => (await axiosSecure.get('/admin/orders', { params: filters })).data,
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  })
}

export function useAdminOrder(orderId) {
  const axiosSecure = useAxiosSecure()
  return useQuery({
    queryKey: ['admin', 'orders', 'one', orderId],
    queryFn: async () => (await axiosSecure.get(`/admin/orders/${encodeURIComponent(orderId)}`)).data,
    staleTime: 30 * 1000,
    retry: (count, error) => error?.response?.status !== 404 && count < 1,
  })
}

export function useAdminDashboard() {
  const axiosSecure = useAxiosSecure()
  return useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: async () => (await axiosSecure.get('/admin/dashboard')).data,
    staleTime: 60 * 1000,
  })
}

function useOrderMutation(mutationFn, { stockChanges = false } = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: (order) => {
      queryClient.setQueryData(['admin', 'orders', 'one', order.orderId], order)
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
      if (stockChanges) {
        queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
        queryClient.invalidateQueries({ queryKey: ['products'] })
        queryClient.invalidateQueries({ queryKey: ['product'] })
      }
    },
  })
}

// { orderId, status, note } -> the updated order. Cancelling puts stock back.
export function useUpdateOrderStatus() {
  const axiosSecure = useAxiosSecure()
  return useOrderMutation(async ({ orderId, status, note }) => (await axiosSecure.patch(`/admin/orders/${encodeURIComponent(orderId)}/status`, { status, note })).data, {
    stockChanges: true,
  })
}

// { orderId, courier, trackingNumber } -> the updated order.
export function useUpdateCourier() {
  const axiosSecure = useAxiosSecure()
  return useOrderMutation(async ({ orderId, courier, trackingNumber }) => (await axiosSecure.patch(`/admin/orders/${encodeURIComponent(orderId)}/courier`, { courier, trackingNumber })).data)
}
