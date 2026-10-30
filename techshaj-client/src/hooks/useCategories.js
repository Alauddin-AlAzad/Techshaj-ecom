import { useQuery } from '@tanstack/react-query'
import { pick } from '../lib/query.js'
import { useAxiosPublic } from './useAxiosPublic.js'

// The server sends parents with their children nested; a flat list is accepted too.
const toTree = (categories) => {
  const flat = categories.flatMap(({ children = [], ...c }) => [c, ...children])
  return flat.filter((c) => !c.parentId).map((p) => ({ ...p, children: flat.filter((c) => c.parentId === p.id) }))
}

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
