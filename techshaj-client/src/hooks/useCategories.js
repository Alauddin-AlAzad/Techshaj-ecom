import { useQuery } from '@tanstack/react-query'
import { pick } from '../lib/query.js'
import { useStorefrontFetch } from './useStorefront.js'

// The server sends parents with their children nested; a flat list is accepted too.
const toTree = (categories) => {
  const flat = categories.flatMap(({ children = [], ...c }) => [c, ...children])
  return flat.filter((c) => !c.parentId).map((p) => ({ ...p, children: flat.filter((c) => c.parentId === p.id) }))
}

export function useCategories() {
  const fetchStorefront = useStorefrontFetch()
  return pick(
    useQuery({
      queryKey: ['categories'],
      queryFn: async () => (await fetchStorefront()).categories,
      select: toTree,
    }),
  )
}
