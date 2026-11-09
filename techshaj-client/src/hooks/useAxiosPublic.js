import axios from 'axios'

const axiosPublic = axios.create({ baseURL: import.meta.env.VITE_API_URL })

// Reads give up after 15s so a stalled network shows Retry instead of endless skeletons.
// Orders and other writes keep no limit, so a slow order is never sent twice.
axiosPublic.interceptors.request.use((config) => ({ ...config, timeout: config.method === 'get' ? 15000 : 0 }))

// For public routes; no token is sent.
export function useAxiosPublic() {
  return axiosPublic
}
