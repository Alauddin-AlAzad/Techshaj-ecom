import { useQueryClient } from '@tanstack/react-query'
import { useAxiosPublic } from './useAxiosPublic.js'

// Banners, offers and categories come from one request; the three hooks share it.
export function useStorefrontFetch() {
  const queryClient = useQueryClient()
  const axiosPublic = useAxiosPublic()
  return () =>
    queryClient.fetchQuery({
      queryKey: ['storefront'],
      queryFn: async () => (await axiosPublic.get('/storefront')).data,
      staleTime: 2000,
      retry: false,
    })
}
