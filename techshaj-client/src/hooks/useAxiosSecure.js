import axios from 'axios'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const axiosSecure = axios.create({ baseURL: import.meta.env.VITE_API_URL })

// For admin routes: sends the stored token and signs out on 401/403.
export function useAxiosSecure() {
  const navigate = useNavigate()

  useEffect(() => {
    const request = axiosSecure.interceptors.request.use((config) => {
      const token = localStorage.getItem('access-token')
      if (token) config.headers.Authorization = `Bearer ${token}`
      return config
    })
    const response = axiosSecure.interceptors.response.use(
      (res) => res,
      (error) => {
        const status = error.response?.status
        if (status === 401 || status === 403) {
          localStorage.removeItem('access-token')
          const { pathname, search } = window.location
          if (pathname !== '/admin/login') navigate('/admin/login', { replace: true, state: { from: pathname + search } })
        }
        return Promise.reject(error)
      },
    )
    return () => {
      axiosSecure.interceptors.request.eject(request)
      axiosSecure.interceptors.response.eject(response)
    }
  }, [navigate])

  return axiosSecure
}
