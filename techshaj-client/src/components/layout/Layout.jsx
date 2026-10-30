import { Link, Outlet } from 'react-router-dom'
import Logo from '../Logo.jsx'

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <header className="bg-dark">
        <div className="mx-auto max-w-7xl px-4 py-4 lg:px-14">
          <Link to="/" aria-label="TechShaj home" className="w-fit">
            <Logo />
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 lg:px-14">
        <Outlet />
      </main>
    </div>
  )
}
