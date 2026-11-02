import axios from 'axios'

const axiosPublic = axios.create({ baseURL: import.meta.env.VITE_API_URL, timeout: 20000 })

// For public routes; no token is sent.
export function useAxiosPublic() {
  return axiosPublic
}
