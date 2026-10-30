import { useEffect, useState } from 'react'

// Runs an async loader (e.g. from data/api.js) and returns its result; null until resolved.
export function useAsync(load, deps = []) {
  const [data, setData] = useState(null)

  useEffect(() => {
    let active = true
    load().then((result) => active && setData(result))
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return data
}
