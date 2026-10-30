import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAxiosSecure } from './useAxiosSecure.js'

const byOrder = (a, b) => (a.order ?? 0) - (b.order ?? 0) || a.id - b.id

// Parents in admin order, each with its children; categories only go two levels deep.
export const toTree = (categories = []) => {
  const sorted = [...categories].sort(byOrder)
  return sorted.filter((c) => !c.parentId).map((p) => ({ ...p, children: sorted.filter((c) => c.parentId === p.id) }))
}

// Every category, including inactive ones, as a flat list.
export function useAdminCategories() {
  const axiosSecure = useAxiosSecure()
  return useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: async () => (await axiosSecure.get('/admin/categories')).data,
  })
}

function useCategoryMutation(mutationFn) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] })
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}

export function useSaveCategory() {
  const axiosSecure = useAxiosSecure()
  return useCategoryMutation(async ({ id, data }) =>
    (id ? await axiosSecure.patch(`/admin/categories/${id}`, data) : await axiosSecure.post('/admin/categories', data)).data,
  )
}

export function useDeleteCategory() {
  const axiosSecure = useAxiosSecure()
  return useCategoryMutation(async (id) => (await axiosSecure.delete(`/admin/categories/${id}`)).data)
}

// ids: every category on one level, in the new order.
export function useReorderCategories() {
  const axiosSecure = useAxiosSecure()
  return useCategoryMutation(async ({ parentId, ids }) => (await axiosSecure.post('/admin/categories/reorder', { parentId, ids })).data)
}
