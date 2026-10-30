import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { getCategories, getStore } from '../../data/api.js'
import { useAsync } from '../../hooks/useAsync.js'
import BottomNav from './BottomNav.jsx'
import FloatingContact from './FloatingContact.jsx'
import Footer from './Footer.jsx'
import Header from './Header.jsx'

export default function Layout() {
  const store = useAsync(getStore)
  const categories = useAsync(getCategories)
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header store={store} categories={categories} />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer store={store} />
      <FloatingContact store={store} />
      <BottomNav />
    </div>
  )
}
