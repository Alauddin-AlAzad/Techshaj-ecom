import { Heart, Menu, PackageSearch, Search, ShoppingCart, Truck } from 'lucide-react'
import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { selectCartCount, useCartStore } from '../../context/useCartStore.js'
import { selectFavoriteCount, useFavoriteStore } from '../../context/useFavoriteStore.js'
import CountBadge from '../CountBadge.jsx'
import Logo from '../Logo.jsx'
import AnnouncementBar from './AnnouncementBar.jsx'
import CategoryNav from './CategoryNav.jsx'
import MobileMenu from './MobileMenu.jsx'
import MobileSearch from './MobileSearch.jsx'
import SearchBar from './SearchBar.jsx'

function MobileHeader({ cartCount, store, categories }) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const closeSearch = useCallback(() => setSearchOpen(false), [])
  const closeMenu = useCallback(() => setMenuOpen(false), [])

  return (
    <div className="flex flex-col gap-3 bg-dark px-4 pt-3 pb-3.5 lg:hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setMenuOpen(true)} aria-label="Open menu" aria-expanded={menuOpen} className="text-white">
            <Menu size={24} />
          </button>
          <Link to="/" aria-label="TechShaj home">
            <Logo size="sm" />
          </Link>
        </div>
        <div className="flex items-center gap-[18px] text-white">
          <Link to="/track-order" aria-label="Track order">
            <Truck size={22} />
          </Link>
          <Link to="/cart" aria-label={`Cart, ${cartCount} items`} className="relative">
            <ShoppingCart size={22} />
            <CountBadge count={cartCount} className="top-[-6px] left-2.5" />
          </Link>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setSearchOpen(true)}
        className="flex h-[42px] items-center gap-2.5 rounded-[22px] bg-dark-field px-4 text-left text-body text-text-faint"
      >
        <Search size={17} className="shrink-0" />
        Search products…
      </button>
      {searchOpen && <MobileSearch onClose={closeSearch} />}
      {menuOpen && <MobileMenu store={store} categories={categories} onClose={closeMenu} />}
    </div>
  )
}

function DesktopHeader({ cartCount, favoriteCount }) {
  const openCart = useCartStore((s) => s.openDrawer)

  return (
    <div className="relative z-40 hidden bg-dark lg:block">
      <div className="site-container flex h-20 items-center gap-10">
        <Link to="/" aria-label="TechShaj home" className="shrink-0">
          <Logo />
        </Link>
        <SearchBar
          placeholder="Search for power bank, earbuds, smart watch…"
          className="h-[46px] flex-1 gap-2.5 rounded-3xl px-5"
          iconClassName="size-[18px]"
        />
        <div className="flex shrink-0 items-center gap-[22px] text-white">
          <Link to="/track-order" className="flex items-center gap-1.5 text-label whitespace-nowrap">
            <PackageSearch size={18} />
            Track Order
          </Link>
          <Link to="/favorite" aria-label={`Favorites, ${favoriteCount} items`} className="relative">
            <Heart size={22} />
            <CountBadge count={favoriteCount} className="-top-2 left-3" />
          </Link>
          <button type="button" onClick={openCart} aria-label={`Cart, ${cartCount} items`} className="relative">
            <ShoppingCart size={22} />
            <CountBadge count={cartCount} className="-top-2 left-3" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Header({ store, categories }) {
  const cartCount = useCartStore(selectCartCount)
  const favoriteCount = useFavoriteStore(selectFavoriteCount)

  return (
    <header>
      <AnnouncementBar messages={store?.announcements} />
      <MobileHeader cartCount={cartCount} store={store} categories={categories ?? []} />
      <DesktopHeader cartCount={cartCount} favoriteCount={favoriteCount} />
      <div className="hidden lg:block">
        <CategoryNav categories={categories ?? []} />
      </div>
    </header>
  )
}
