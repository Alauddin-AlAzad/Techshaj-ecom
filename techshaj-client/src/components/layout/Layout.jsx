import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { getCategories, getStore } from '../../data/api.js'
import { useCartStore } from '../../context/useCartStore.js'
import { useAsync } from '../../hooks/useAsync.js'
import { cn } from '../../lib/cn.js'
import CartDrawer from '../cart/CartDrawer.jsx'
import BottomNav from './BottomNav.jsx'
import FloatingContact from './FloatingContact.jsx'
import Footer from './Footer.jsx'
import Header from './Header.jsx'

export default function Layout() {
  const store = useAsync(getStore)
  const categories = useAsync(getCategories)
  const { pathname } = useLocation()
  const closeDrawer = useCartStore((s) => s.closeDrawer)
  // These mobile frames replace the site header and footer with their own top bar; checkout also drops the bottom nav.
  const bareMobile = ['/cart', '/checkout', '/favorite'].includes(pathname)

  useEffect(() => {
    window.scrollTo(0, 0)
    closeDrawer()
  }, [pathname, closeDrawer])

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <div className={cn(bareMobile && 'max-lg:hidden')}>
        <Header store={store} categories={categories} />
      </div>
      <main className="flex-1">
        <Outlet />
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
