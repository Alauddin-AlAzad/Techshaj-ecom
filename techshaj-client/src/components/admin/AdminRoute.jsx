import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAdmin } from '../../hooks/useAdmin.js'
import { FullPageSpinner } from './Spinner.jsx'

// Guards every /admin page except login; login sends the admin back to `from`.
export default function AdminRoute({ children }) {
  const { isLoading, isAdmin } = useAdmin()
  const { pathname, search } = useLocation()

  if (isLoading) return <FullPageSpinner />
  if (!isAdmin) return <Navigate to="/admin/login" replace state={{ from: pathname + search }} />
  return children ?? <Outlet />
}
