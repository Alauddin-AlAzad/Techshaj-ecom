import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAxiosSecure } from './useAxiosSecure.js'

// Every banner, sorted by type, order and id.
export function useAdminBanners() {
  const axiosSecure = useAxiosSecure()
  return useQuery({
    queryKey: ['admin', 'banners'],
    queryFn: async () => (await axiosSecure.get('/admin/banners')).data,
  })
}

function useBannerMutation(mutationFn) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'banners'] })
      queryClient.invalidateQueries({ queryKey: ['banners'] })
    },
  })
}

// { id, data }: no id creates a banner, otherwise data holds only the changed fields.
export function useSaveBanner() {
  const axiosSecure = useAxiosSecure()
  return useBannerMutation(async ({ id, data }) => (id ? await axiosSecure.patch(`/admin/banners/${id}`, data) : await axiosSecure.post('/admin/banners', data)).data)
}

export function useDeleteBanner() {
  const axiosSecure = useAxiosSecure()
  return useBannerMutation(async (id) => (await axiosSecure.delete(`/admin/banners/${id}`)).data)
}
