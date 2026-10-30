import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAxiosSecure } from './useAxiosSecure.js'

export function useAdminCoupons() {
  const axiosSecure = useAxiosSecure()
  return useQuery({
    queryKey: ['admin', 'coupons'],
    queryFn: async () => (await axiosSecure.get('/admin/coupons')).data,
  })
}

function useCouponMutation(mutationFn) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] })
      queryClient.invalidateQueries({ queryKey: ['offers'] })
    },
  })
}

// { id, data }: no id creates a coupon, otherwise data holds only the changed fields.
export function useSaveCoupon() {
  const axiosSecure = useAxiosSecure()
  return useCouponMutation(async ({ id, data }) => (id ? await axiosSecure.patch(`/admin/coupons/${id}`, data) : await axiosSecure.post('/admin/coupons', data)).data)
}

export function useDeleteCoupon() {
  const axiosSecure = useAxiosSecure()
  return useCouponMutation(async (id) => (await axiosSecure.delete(`/admin/coupons/${id}`)).data)
}
