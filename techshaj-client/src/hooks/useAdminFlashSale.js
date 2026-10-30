import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAxiosPublic } from './useAxiosPublic.js'
import { useAxiosSecure } from './useAxiosSecure.js'

// The running sale from the public GET /offers ({ coupons, flashSale }); flashSale is null when none is running.
export function useCurrentFlashSale() {
  const axiosPublic = useAxiosPublic()
  return useQuery({
    queryKey: ['offers'],
    queryFn: async () => (await axiosPublic.get('/offers')).data,
    staleTime: 0,
    select: (data) => data.flashSale,
  })
}

// { title?, endsAt?, active?, productIds? }. Creates the sale when there is none yet.
export function useSaveFlashSale() {
  const axiosSecure = useAxiosSecure()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data) => (await axiosSecure.patch('/admin/offers/flash-sale', data)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offers'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}
