export function whatsappOrderUrl(whatsapp, product) {
  const text = `Hi, I want to order ${product.name} (${product.code})`
  return `https://wa.me/${whatsapp}?text=${encodeURIComponent(text)}`
}

// First option of every variant group, e.g. { Color: 'Black' }
export function defaultVariant(product) {
  return Object.fromEntries(product.variants.map((v) => [v.name, v.options[0]]))
}
