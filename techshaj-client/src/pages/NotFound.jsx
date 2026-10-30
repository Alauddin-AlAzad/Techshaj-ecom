import { House, ShoppingBag } from 'lucide-react'
import { Link } from 'react-router-dom'
import { usePageTitle } from '../hooks/usePageTitle.js'

// Figma "404" desktop (40:5864) and mobile (40:6483).
export default function NotFound() {
  usePageTitle('Page not found')
  return (
    <div className="flex flex-col items-center gap-2.5 px-6 pt-[90px] pb-24 text-center lg:gap-3 lg:py-20">
      <p className="text-[96px] font-extrabold tracking-[-3.84px] text-primary lg:text-[140px] lg:tracking-[-5.6px]">404</p>
      <h1 className="text-[22px] font-bold text-text lg:text-h2">Page not found</h1>
      <p className="max-w-[342px] text-body text-text-muted lg:max-w-none lg:text-body-lg">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
      <div className="flex w-full gap-3 lg:w-auto lg:pt-3">
        <Link to="/" className="flex h-12 flex-1 items-center justify-center gap-2 rounded-[10px] bg-text px-6 text-body font-bold text-white lg:flex-none">
          <House size={17} />
          Go to Home
        </Link>
        <Link to="/shop" className="hidden h-12 items-center gap-2 rounded-[10px] border border-border-strong px-6 text-body font-bold text-text lg:flex">
          <ShoppingBag size={17} />
          Browse products
        </Link>
      </div>
    </div>
  )
}
