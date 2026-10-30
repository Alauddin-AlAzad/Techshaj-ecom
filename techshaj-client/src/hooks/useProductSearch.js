import { useEffect, useState } from 'react'
import { searchProducts } from '../data/api.js'

export function useProductSearch(query, limit = 5) {
  const [state, setState] = useState({ total: 0, results: [] })

  useEffect(() => {
    let active = true
    searchProducts(query, limit).then((r) => active && setState(r))
    return () => {
      active = false
    }
  }, [query, limit])

  return state
}
