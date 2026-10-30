export const TOKEN_KEY = 'access-token'

export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token)
export const clearToken = () => localStorage.removeItem(TOKEN_KEY)

export const isAuthError = (error) => [401, 403].includes(error?.response?.status)
