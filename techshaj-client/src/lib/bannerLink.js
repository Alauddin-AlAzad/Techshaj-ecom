import storefront from '../data/storefront.json'

export const LINK_TARGETS = [
  { value: 'category', label: 'Category' },
  { value: 'product', label: 'Product' },
  { value: 'collection', label: 'Collection' },
  { value: 'offers', label: 'Offers page' },
  { value: 'shop', label: 'All products (Shop)' },
  { value: 'page', label: 'Other page' },
  { value: 'custom', label: 'Custom link' },
  { value: 'none', label: 'No link' },
]

export const LINK_COLLECTIONS = storefront.collections

export const LINK_PAGES = [
  { value: '/about', label: 'About us' },
  { value: '/contact', label: 'Contact us' },
  { value: '/faq', label: 'FAQ' },
  { value: '/blog', label: 'Blog' },
  { value: '/categories', label: 'All categories' },
  { value: '/track-order', label: 'Track order' },
  { value: '/policy/shipping', label: 'Shipping & delivery' },
  { value: '/policy/return', label: 'Returns & refund' },
  { value: '/policy/privacy', label: 'Privacy policy' },
  { value: '/policy/terms', label: 'Terms & conditions' },
]

export const isExternalLink = (link) => /^https?:\/\//i.test(link ?? '')
export const isValidCustomLink = (link) => /^\/\S*$/.test(link) || /^https:\/\/\S+$/.test(link)

// linkTarget { type, value } -> the URL the storefront opens. '' means no link.
export function linkFromTarget(target) {
  const value = target?.value?.trim() ?? ''
  switch (target?.type) {
    case 'category':
      return value ? `/category/${value}` : ''
    case 'product':
      return value ? `/product/${value}` : ''
    case 'collection':
      return value ? `/shop?col=${encodeURIComponent(value)}` : ''
    case 'offers':
      return '/offers'
    case 'shop':
      return '/shop'
    case 'page':
    case 'custom':
      return value
    default:
      return ''
  }
}

// Older banners only have a link string; read it back into a selector choice.
export function targetFromLink(link) {
  const l = link?.trim() ?? ''
  if (!l) return { type: 'none', value: '' }
  if (l === '/offers') return { type: 'offers', value: '' }
  if (l === '/shop') return { type: 'shop', value: '' }
  let m = l.match(/^\/category\/([^/?#]+)$/)
  if (m) return { type: 'category', value: decodeURIComponent(m[1]) }
  m = l.match(/^\/product\/([^/?#]+)$/)
  if (m) return { type: 'product', value: decodeURIComponent(m[1]) }
  m = l.match(/^\/shop\?(?:col|collection)=([^&#]+)$/)
  if (m && LINK_COLLECTIONS.some((c) => c.slug === decodeURIComponent(m[1]))) return { type: 'collection', value: decodeURIComponent(m[1]) }
  if (LINK_PAGES.some((p) => p.value === l)) return { type: 'page', value: l }
  return { type: 'custom', value: l }
}
