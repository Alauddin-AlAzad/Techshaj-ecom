import { Suspense, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useCartStore } from '../../context/useCartStore.js'
import { useCategories } from '../../hooks/useCategories.js'
import { useSettings } from '../../hooks/useSettings.js'
import { cn } from '../../lib/cn.js'
import { notify } from '../../lib/notify.jsx'
import { PageSkeleton } from '../Skeleton.jsx'
import CartDrawer from '../cart/CartDrawer.jsx'
import BottomNav from './BottomNav.jsx'
import FloatingContact from './FloatingContact.jsx'
import Footer from './Footer.jsx'
import Header from './Header.jsx'

export default function Layout() {
  const { data: store = null } = useSettings()
  const { data: categories = null } = useCategories()
  const { pathname } = useLocation()
  const closeDrawer = useCartStore((s) => s.closeDrawer)
  // These mobile frames replace the site header and footer with their own top bar; checkout also drops the bottom nav.
  const bareMobile = ['/cart', '/checkout', '/favorite'].includes(pathname)

  // Scroll to top on every route change.
  useEffect(() => {
    window.scrollTo(0, 0)
    closeDrawer()
  }, [pathname, closeDrawer])

  useEffect(() => {
    const offline = () =>
      notify.error('No internet connection', {
        id: 'offline',
        description: 'Check your connection and try again',
        action: { label: 'Retry', onClick: () => window.location.reload() },
        duration: Infinity,
      })
    const online = () => notify.dismiss('offline')
    window.addEventListener('offline', offline)
    window.addEventListener('online', online)
    return () => {
      window.removeEventListener('offline', offline)
      window.removeEventListener('online', online)
    }
  }, [])

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <div className={cn(bareMobile && 'max-lg:hidden')}>
        <Header store={store} categories={categories} />
      </div>
      <main className="flex-1">
        <Suspense fallback={<PageSkeleton pathname={pathname} />}>
          <Outlet />
        </Suspense>
      </main>
      <div className={cn(bareMobile && 'max-lg:hidden')}>
        <Footer store={store} />
      </div>
      <FloatingContact store={store} />
      {pathname !== '/checkout' && <BottomNav />}
      <CartDrawer />
    </div>
  )
}
