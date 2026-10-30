import { useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { clearToken } from '../lib/adminAuth.js'

export function useLogout() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  return useCallback(() => {
    clearToken()
    queryClient.clear()
    navigate('/admin/login', { replace: true })
  }, [queryClient, navigate])
}
