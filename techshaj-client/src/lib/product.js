export function whatsappOrderUrl(whatsapp, product) {
  const text = `Hi, I want to order ${product.name} (${product.code})`
  return `https://wa.me/${whatsapp}?text=${encodeURIComponent(text)}`
}

// First option of every variant group, e.g. { Color: 'Black' }
export function defaultVariant(product) {
  return Object.fromEntries((product.variants ?? []).map((v) => [v.name, v.options[0]]))
}

// The picture of the first chosen option that has one, otherwise the main image.
export function variantImage(product, variant = {}) {
  const picked = Object.entries(variant).map(([name, option]) => product.optionImages?.[name]?.[option])
  return picked.find(Boolean) ?? product.images[0]
}
