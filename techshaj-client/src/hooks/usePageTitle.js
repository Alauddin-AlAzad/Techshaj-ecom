import { useEffect } from 'react'

const SITE = 'TechShaj'
const DEFAULT_TITLE = `${SITE} | Gadgets & Accessories in Bangladesh`

// Sets the tab title for the current route; no title gives the home page title.
export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | ${SITE}` : DEFAULT_TITLE
  }, [title])
}
