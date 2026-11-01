export function whatsappOrderUrl(whatsapp, product) {
  const text = `Hi, I want to order ${product.name} (${product.code})`
  return `https://wa.me/${whatsapp}?text=${encodeURIComponent(text)}`
}

// First option of every variant group, e.g. { Color: 'Black' }
export function defaultVariant(product) {
  return Object.fromEntries((product.variants ?? []).map((v) => [v.name, v.options[0]]))
}

// Option pictures are stored as a list per option; older products hold a single url.
export function optionPics(product, name, option) {
  const value = product.optionImages?.[name]?.[option]
  return [value ?? []].flat().filter(Boolean)
}

// The pictures of the first chosen option that has any, otherwise the product gallery.
export function variantImages(product, variant = {}) {
  for (const [name, option] of Object.entries(variant)) {
    const pics = optionPics(product, name, option)
    if (pics.length) return pics
  }
  return product.images
}

export function variantImage(product, variant = {}) {
  return variantImages(product, variant)[0]
}

// Every picture of the product: the gallery first, then pictures that only belong to an option.
export function allImages(product) {
  const optionPicsAll = Object.values(product.optionImages ?? {}).flatMap((options) => Object.values(options).flatMap((v) => [v].flat()))
  return [...new Set([...product.images, ...optionPicsAll].filter(Boolean))]
}

// The first variant option that owns this picture, as { name, option }.
export function optionOfImage(product, src) {
  for (const [name, options] of Object.entries(product.optionImages ?? {})) {
    const option = Object.keys(options).find((o) => [options[o]].flat().includes(src))
    if (option && product.variants?.some((v) => v.name === name && v.options.includes(option))) return { name, option }
  }
  return null
}
