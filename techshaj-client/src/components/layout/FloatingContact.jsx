import { MessagesSquare, X } from 'lucide-react'
import { useState } from 'react'
import { FaFacebookMessenger, FaWhatsapp } from 'react-icons/fa'
import { useLocation } from 'react-router-dom'
import { useCartStore } from '../../context/useCartStore.js'
import { cn } from '../../lib/cn.js'

// Figma "Floating Contact" (92:17074). Sits above the mobile bottom nav.
export default function FloatingContact({ store }) {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  // Product pages have a 69px sticky order bar above the mobile bottom nav, the cart a 138px summary.
  const raised = pathname.startsWith('/product/')
  const hasItems = useCartStore((s) => s.items.length > 0)
  const aboveCart = pathname === '/cart' && hasItems
  if (!store || pathname === '/checkout') return null

  const links = [
    { href: `https://wa.me/${store.whatsapp}`, label: 'WhatsApp', Icon: FaWhatsapp, bg: 'bg-whatsapp' },
    { href: `https://m.me/${store.messengerUsername}`, label: 'Messenger', Icon: FaFacebookMessenger, bg: 'bg-facebook' },
  ]

  return (
    <div
      className={cn(
        'fixed right-4 z-40 flex flex-col items-end gap-3 lg:right-6 lg:bottom-6',
        raised
          ? 'bottom-[calc(153px+env(safe-area-inset-bottom))]'
          : aboveCart
            ? 'bottom-[calc(222px+env(safe-area-inset-bottom))]'
            : 'bottom-[calc(84px+env(safe-area-inset-bottom))]',
      )}
    >
      {open &&
        links.map(({ href, label, Icon, bg }) => (
          <a key={label} href={href} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-full bg-white py-1.5 pr-1.5 pl-4 text-label text-text shadow-lg">
            {label}
            <span className={`flex size-9 items-center justify-center rounded-full text-white ${bg}`}>
              <Icon size={18} />
            </span>
          </a>
        ))}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label={open ? 'Close contact options' : 'Contact us'}
        className="relative flex size-[60px] items-center justify-center rounded-full border-3 border-white bg-linear-135 from-whatsapp-light from-14% to-whatsapp-deep to-86% text-white shadow-[0_3px_6px_rgba(0,0,0,0.18),0_8px_22px_color-mix(in_srgb,var(--color-whatsapp-deep)_55%,transparent)]"
      >
        {!open && <span className="absolute -inset-2 animate-pulse-ring rounded-full bg-whatsapp-light/40 motion-reduce:hidden" aria-hidden="true" />}
        {open ? <X size={26} /> : <MessagesSquare size={28} />}
      </button>
    </div>
  )
}
