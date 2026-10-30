export const DEFAULT_STORE_NAME = 'TechShaj'

// Store name, logo and favicon from GET /settings, with the built-in defaults when nothing is saved.
export const brandingOf = (settings) => ({
  name: settings?.name?.trim() || DEFAULT_STORE_NAME,
  logoUrl: settings?.logoUrl || null,
  faviconUrl: settings?.faviconUrl || null,
})
