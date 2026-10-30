import { useLocation } from 'react-router-dom'
import { Toaster } from 'sonner'
import { useCartStore } from '../context/useCartStore.js'
import { useIsDesktop } from '../hooks/useMediaQuery.js'

// Figma "Toast – Desktop" (86:16121): top-right, 180px down, 24px in.
// "Toast – Mobile" (86:16612): 16px gutters, 12px above the 68px bottom nav and any sticky bar on top of it.
function mobileBottom(pathname, hasCartItems) {
  if (pathname === '/checkout' || pathname.startsWith('/admin')) return '16px'
  const bar = pathname.startsWith('/product/') ? 69 : pathname === '/cart' && hasCartItems ? 138 : 0
  return `calc(${68 + bar + 12}px + env(safe-area-inset-bottom))`
}

export default function AppToaster() {
  const isDesktop = useIsDesktop()
  const { pathname } = useLocation()
  const hasCartItems = useCartStore((s) => s.items.length > 0)
  // Admin pages have no bottom nav and a 72px top bar instead of the storefront header.
  const desktopTop = pathname.startsWith('/admin') ? 88 : 180
  const mobileOffset = { bottom: mobileBottom(pathname, hasCartItems), left: 16, right: 16 }

  return (
    <Toaster
      position={isDesktop ? 'top-right' : 'bottom-center'}
      offset={isDesktop ? { top: desktopTop, right: 24 } : mobileOffset}
      mobileOffset={mobileOffset}
      gap={10}
      visibleToasts={3}
      style={{ '--width': '380px' }}
    />
  )
}
