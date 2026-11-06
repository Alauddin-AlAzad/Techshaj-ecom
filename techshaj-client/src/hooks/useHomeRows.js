import { useQuery } from '@tanstack/react-query'
import { pick } from '../lib/query.js'
import { useAxiosPublic } from './useAxiosPublic.js'

// Returns { 'best-deal', 'best-seller', 'new-arrival', byCategory: { [slug]: products } }.
export function useHomeRows() {
  const axiosPublic = useAxiosPublic()
  return pick(useQuery({ queryKey: ['products', 'home'], queryFn: async () => (await axiosPublic.get('/home')).data }))
}
