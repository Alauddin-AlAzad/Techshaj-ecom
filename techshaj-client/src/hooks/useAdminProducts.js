import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAxiosSecure } from './useAxiosSecure.js'

const MAX_LIMIT = 100

// filters: { search, category, status, stock, page, limit } -> { products, total, page, totalPages }
export function useAdminProducts(filters) {
  const axiosSecure = useAxiosSecure()
  return useQuery({
    queryKey: ['admin', 'products', 'list', filters],
    queryFn: async () => (await axiosSecure.get('/admin/products', { params: filters })).data,
    placeholderData: keepPreviousData,
  })
}

// Products whose name, code or slug match, for pickers. Waits until something is typed.
export function useAdminProductSearch(search, limit = 8) {
  const axiosSecure = useAxiosSecure()
  const term = search.trim()
  return useQuery({
    queryKey: ['admin', 'products', 'list', { search: term, limit }],
    enabled: term.length > 0,
    queryFn: async () => (await axiosSecure.get('/admin/products', { params: { search: term, limit } })).data.products,
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  })
}

// Every product, drafts included, fetched page by page.
export function useAllAdminProducts({ enabled = true } = {}) {
  const axiosSecure = useAxiosSecure()
  return useQuery({
    queryKey: ['admin', 'products', 'all'],
    enabled,
    queryFn: async () => {
      const fetchPage = async (page) => (await axiosSecure.get('/admin/products', { params: { limit: MAX_LIMIT, page } })).data
      const first = await fetchPage(1)
      const rest = await Promise.all(Array.from({ length: Math.max(0, first.totalPages - 1) }, (_, i) => fetchPage(i + 2)))
      return [first, ...rest].flatMap((r) => r.products)
    },
  })
}

// There is no single-product admin route: search by code when it is known, otherwise scan every product.
export function useAdminProduct(id, code) {
  const axiosSecure = useAxiosSecure()
  return useQuery({
    queryKey: ['admin', 'products', 'one', id],
    enabled: Boolean(id),
    staleTime: 0,
    queryFn: async () => {
      const matches = (p) => String(p.id) === String(id)
      if (code) {
        const { products } = (await axiosSecure.get('/admin/products', { params: { search: code, limit: MAX_LIMIT } })).data
        const found = products.find((p) => matches(p) && p.code === code)
        if (found) return found
      }
      for (let page = 1, totalPages = 1; page <= totalPages; page++) {
        const data = (await axiosSecure.get('/admin/products', { params: { limit: MAX_LIMIT, page } })).data
        const found = data.products.find(matches)
        if (found) return found
        totalPages = data.totalPages
      }
      const error = new Error('Product not found')
      error.response = { status: 404, data: { message: 'Product not found' } }
      throw error
    },
  })
}

function useProductMutation(mutationFn) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['product'] })
      queryClient.invalidateQueries({ queryKey: ['offers'] })
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] })
    },
  })
}

export function useCreateProduct() {
  const axiosSecure = useAxiosSecure()
  return useProductMutation(async (data) => (await axiosSecure.post('/admin/products', data)).data)
}

// { id, data } where data holds only the changed fields.
export function useUpdateProduct() {
  const axiosSecure = useAxiosSecure()
  return useProductMutation(async ({ id, data }) => (await axiosSecure.patch(`/admin/products/${id}`, data)).data)
}

export function useDeleteProduct() {
  const axiosSecure = useAxiosSecure()
  return useProductMutation(async (id) => (await axiosSecure.delete(`/admin/products/${id}`)).data)
}
