import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAxiosSecure } from './useAxiosSecure.js'

// Parents in id order, each with its children; categories only go two levels deep.
export const toTree = (categories = []) =>
  categories.filter((c) => !c.parentId).map((p) => ({ ...p, children: categories.filter((c) => c.parentId === p.id) }))

// The server has no admin list route; the public /categories route returns every category.
export function useAdminCategories() {
  const axiosSecure = useAxiosSecure()
  return useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: async () => (await axiosSecure.get('/categories')).data,
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
