import { useMutation } from '@tanstack/react-query'
import { useAxiosPublic } from './useAxiosPublic.js'

// { code, subtotal } -> { valid, discount, message }
export function useValidateCoupon() {
  const axiosPublic = useAxiosPublic()
  return useMutation({ mutationFn: async (body) => (await axiosPublic.post('/coupons/validate', body)).data })
}

// { customer, zoneId, paymentMethod, transactionId, couponCode, items } -> { orderId, total }
export function usePlaceOrder() {
  const axiosPublic = useAxiosPublic()
  return useMutation({ mutationFn: async (body) => (await axiosPublic.post('/orders', body)).data })
}
