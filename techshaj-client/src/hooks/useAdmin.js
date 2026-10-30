import { useQuery } from '@tanstack/react-query'
import { getToken, isAuthError } from '../lib/adminAuth.js'
import { useAxiosSecure } from './useAxiosSecure.js'

// { name, email } of the signed-in admin.
export function useAdmin() {
  const axiosSecure = useAxiosSecure()
  const token = getToken()
  const query = useQuery({
    queryKey: ['admin', 'me', token],
    queryFn: async () => (await axiosSecure.get('/admin/me')).data,
    enabled: Boolean(token),
    staleTime: Infinity,
    retry: (count, error) => !isAuthError(error) && count < 1,
  })

  return {
    admin: query.data ?? null,
    isLoading: Boolean(token) && query.isPending,
    isAdmin: Boolean(token) && Boolean(query.data),
    isError: query.isError,
  }
}
