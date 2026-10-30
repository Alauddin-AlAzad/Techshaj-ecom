import { Suspense, useCallback, useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useAdmin } from '../../hooks/useAdmin.js'
import { useLogout } from '../../hooks/useLogout.js'
import { usePageTitle } from '../../hooks/usePageTitle.js'
import { cn } from '../../lib/cn.js'
import { sectionTitle } from './nav.js'
import Sidebar from './Sidebar.jsx'
import Spinner from './Spinner.jsx'
import Topbar from './Topbar.jsx'

export default function AdminLayout() {
  const { admin } = useAdmin()
  const logout = useLogout()
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const closeMenu = useCallback(() => setMenuOpen(false), [])
  const title = sectionTitle(pathname)
  usePageTitle(`${title} · Admin`)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e) => e.key === 'Escape' && closeMenu()
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = overflow
      window.removeEventListener('keydown', onKey)
    }
  }, [menuOpen, closeMenu])

  return (
    <div className="min-h-screen bg-surface print:min-h-0 print:bg-white">
      <aside className="fixed inset-y-0 left-0 z-40 hidden lg:block print:hidden">
        <Sidebar onLogout={logout} />
      </aside>

      <div className={cn('fixed inset-0 z-50 lg:hidden print:hidden', !menuOpen && 'pointer-events-none')} aria-hidden={!menuOpen}>
        <button
          type="button"
          tabIndex={menuOpen ? 0 : -1}
          aria-label="Close menu"
          onClick={closeMenu}
          className={cn('absolute inset-0 size-full bg-dark/55 transition-opacity', menuOpen ? 'opacity-100' : 'opacity-0')}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          inert={!menuOpen}
          className={cn('relative h-full w-fit max-w-[87%] transition-transform duration-300', menuOpen ? 'translate-x-0' : '-translate-x-full')}
        >
          <Sidebar onClose={closeMenu} onLogout={logout} />
        </div>
      </div>

      <div className="flex min-h-screen min-w-0 flex-col overflow-x-clip lg:pl-[260px] print:min-h-0 print:p-0">
        <Topbar title={title} admin={admin} onMenu={() => setMenuOpen(true)} onLogout={logout} />
        <main className="flex-1 px-4 pt-5 pb-10 lg:px-7 lg:pt-7 print:p-0">
          <Suspense
            fallback={
              <div role="status" aria-label="Loading" className="flex justify-center py-20 text-primary">
                <Spinner size={32} />
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  )
}
