import { useEffect } from 'react'
import { setPageTitle } from '../lib/documentTitle.js'

// Sets the tab title for the current route; no title gives the home page title.
export function usePageTitle(title) {
  useEffect(() => {
    setPageTitle(title)
  }, [title])
}
