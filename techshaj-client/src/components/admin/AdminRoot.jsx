import { Suspense, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { FullPageSpinner } from './Spinner.jsx'

// Parent of every /admin route: keeps admin pages out of search engines.
export default function AdminRoot() {
  useEffect(() => {
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex, nofollow'
    document.head.appendChild(meta)
    return () => meta.remove()
  }, [])

  return (
    <Suspense fallback={<FullPageSpinner />}>
      <Outlet />
    </Suspense>
  )
}
