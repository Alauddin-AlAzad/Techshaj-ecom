import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAxiosPublic } from './useAxiosPublic.js'
import { useAxiosSecure } from './useAxiosSecure.js'

// Same data and cache as useSettings, but always fresh when the settings page opens.
export function useAdminSettings() {
  const axiosPublic = useAxiosPublic()
  return useQuery({
    queryKey: ['settings'],
    queryFn: async () => (await axiosPublic.get('/settings')).data,
    staleTime: 0,
    retry: (count, error) => error?.response?.status !== 404 && count < 1,
  })
}

// { store?, shippingZones?, freeShippingThreshold? }. store keys are merged; shippingZones replaces the list.
export function useSaveSettings() {
  const axiosSecure = useAxiosSecure()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data) => (await axiosSecure.patch('/admin/settings', data)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings'] }),
  })
}
