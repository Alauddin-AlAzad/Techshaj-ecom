// Same rules as the server's slugify, so the preview matches what gets saved.
export const slugify = (text) =>
  String(text ?? '')
    .toLowerCase()
    .replace(/&/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

// "best-seller" -> "Best Seller"
export const labelFromSlug = (slug) => slug.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
