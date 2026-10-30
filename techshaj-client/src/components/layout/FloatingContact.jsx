import { MessagesSquare, Phone, X } from 'lucide-react'
import { useState } from 'react'
import { FaFacebookMessenger, FaWhatsapp } from 'react-icons/fa'
import { useLocation } from 'react-router-dom'
import { useCartStore } from '../../context/useCartStore.js'
import { cn } from '../../lib/cn.js'
import { contactLinks } from '../../lib/contact.js'

const STYLE = {
  messenger: { Icon: FaFacebookMessenger, bg: 'bg-facebook' },
  call: { Icon: Phone, bg: 'bg-call' },
  whatsapp: { Icon: FaWhatsapp, bg: 'bg-whatsapp-ink' },
}

// Figma "Floating Contact" (92:17073) in the theme pink. Sits above the mobile bottom nav.
export default function FloatingContact({ store }) {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  // Product pages have a 69px sticky order bar above the mobile bottom nav, the cart a 138px summary.
  const raised = pathname.startsWith('/product/')
  const hasItems = useCartStore((s) => s.items.length > 0)
  const aboveCart = pathname === '/cart' && hasItems
  const links = contactLinks(store)
  if (!links.length || pathname === '/checkout') return null

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
        links.map(({ key, href, label }) => {
          const { Icon, bg } = STYLE[key]
          const external = href.startsWith('http')
          return (
            <a
              key={key}
              href={href}
              {...(external && { target: '_blank', rel: 'noopener noreferrer' })}
              className="flex items-center gap-3 text-[15px] font-bold text-text"
            >
              <span className="rounded-[10px] bg-white px-4 py-2 shadow-lg">{label}</span>
              <span className={cn('flex size-[52px] items-center justify-center rounded-full border-3 border-white text-white shadow-lg', bg)}>
                <Icon size={22} />
              </span>
            </a>
          )
        })}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label={open ? 'Close contact options' : 'Contact us'}
        className="relative flex size-[60px] items-center justify-center rounded-full border-3 border-white bg-primary text-white shadow-[0_3px_6px_rgba(0,0,0,0.18),0_8px_22px_color-mix(in_srgb,var(--color-primary)_55%,transparent)]"
      >
        {!open && <span className="absolute -inset-2 animate-pulse-ring rounded-full bg-primary/40 motion-reduce:hidden" aria-hidden="true" />}
        <span className="relative">{open ? <X size={26} /> : <MessagesSquare size={28} />}</span>
      </button>
    </div>
  )
}
