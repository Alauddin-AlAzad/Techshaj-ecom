export const CONTACT_BUTTONS = ['messenger', 'whatsapp', 'call']

// Floating contact options from the store settings: enabled (default on) and with a value.
export function contactLinks(store) {
  if (!store) return []
  const on = (key) => store.contactButtons?.[key] !== false
  const digits = (value) => String(value ?? '').replace(/[^\d+]/g, '')
  const links = []
  if (on('messenger') && store.messengerUsername?.trim()) links.push({ key: 'messenger', label: 'Messenger', href: `https://m.me/${store.messengerUsername.trim()}` })
  if (on('call') && digits(store.hotline).replace('+', '').length >= 5) links.push({ key: 'call', label: 'Call', href: `tel:${digits(store.hotline)}` })
  if (on('whatsapp') && digits(store.whatsapp).length >= 5) links.push({ key: 'whatsapp', label: 'WhatsApp', href: `https://wa.me/${digits(store.whatsapp).replace('+', '')}` })
  return links
}
