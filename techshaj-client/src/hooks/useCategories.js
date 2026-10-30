import { useQuery } from '@tanstack/react-query'
import { pick } from '../lib/query.js'
import { useAxiosPublic } from './useAxiosPublic.js'

// Parent categories with their children nested, as the menus and pages use them.
const toTree = (categories) =>
  categories.filter((c) => !c.parentId).map((p) => ({ ...p, children: categories.filter((c) => c.parentId === p.id) }))

export function useCategories() {
  const axiosPublic = useAxiosPublic()
  return pick(
    useQuery({
      queryKey: ['categories'],
      queryFn: async () => (await axiosPublic.get('/categories')).data,
      select: toTree,
    }),
  )
}
