import { DEFAULT_STORE_NAME } from './branding.js'

let pageTitle = null
let siteName = DEFAULT_STORE_NAME

const apply = () => {
  document.title = pageTitle ? `${pageTitle} | ${siteName}` : `${siteName} | Gadgets & Accessories in Bangladesh`
}

// The page sets its own part, the app root sets the store name: "Cart | TechShaj".
export function setPageTitle(title) {
  pageTitle = title || null
  apply()
}

export function setSiteName(name) {
  siteName = name || DEFAULT_STORE_NAME
  apply()
}
