import { BadgePercent, Heart, House, ShoppingBag, ShoppingCart } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { selectCartCount, useCartStore } from '../../context/useCartStore.js'
import { selectFavoriteCount, useFavoriteStore } from '../../context/useFavoriteStore.js'
import { cn } from '../../lib/cn.js'
import CountBadge from '../CountBadge.jsx'

export default function BottomNav() {
  const cartCount = useCartStore(selectCartCount)
  const favoriteCount = useFavoriteStore(selectFavoriteCount)

  const items = [
    { to: '/', label: 'Home', Icon: House },
    { to: '/shop', label: 'Shop', Icon: ShoppingBag },
    { to: '/favorite', label: 'Favorite', Icon: Heart, count: favoriteCount },
    { to: '/cart', label: 'Cart', Icon: ShoppingCart, count: cartCount },
    { to: '/offers', label: 'Offers', Icon: BadgePercent },
  ]

  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 box-content flex h-[68px] items-center bg-primary px-2 pb-[env(safe-area-inset-bottom)] lg:hidden">
      {items.map(({ to, label, Icon, count }) => (
        <NavLink key={to} to={to} end={to === '/'} className="flex flex-1 flex-col items-center gap-1 text-white">
          {({ isActive }) => (
            <>
              <span className={cn('relative flex h-[30px] w-12 items-center justify-center rounded-[15px]', isActive && 'bg-white text-primary')}>
                <Icon size={20} />
                {count !== undefined && <CountBadge count={count} className="-top-[3px] left-[30px] size-4 text-[9px]" />}
              </span>
              <span className={cn('text-[11px]', isActive ? 'font-bold' : 'font-medium opacity-85')}>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
