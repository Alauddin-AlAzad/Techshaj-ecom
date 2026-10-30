import { ArrowRight, ChevronDown, ChevronRight, Menu } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useBanners } from '../../hooks/useBanners.js'
import { useAllProducts } from '../../hooks/useProducts.js'
import { useOrderNow } from '../../hooks/useOrderNow.js'
import { cn } from '../../lib/cn.js'
import { discountPercent, formatPrice } from '../../lib/format.js'
import CategoryIcon from '../CategoryIcon.jsx'
import BannerImage from '../home/BannerImage.jsx'

const panel = 'rounded-2xl border border-border bg-white shadow-menu'
const DROPDOWN_WIDTH = 572
const MORE_WIDTH = 300
const GAP = 24
const itemClass = 'flex items-center gap-1 text-[15px] font-medium whitespace-nowrap text-text-secondary hover:text-primary'

// "All Categories" mega menu (Figma 85:16830).
function MegaMenu({ categories, promo, onClose }) {
  return (
    <div className="site-container absolute inset-x-0 top-full z-30 mt-2">
      <div className={cn(panel, 'flex gap-7 p-7')}>
        <div className="flex flex-1 flex-wrap content-start gap-7">
          {categories.map((c) => (
            <div key={c.id} className="flex w-[196px] flex-col items-start gap-2.5">
              <Link to={`/category/${c.slug}`} onClick={onClose} className="flex w-full items-center gap-2.5 text-[14px] font-bold text-text hover:text-primary">
                <span className="flex size-[30px] shrink-0 items-center justify-center rounded-lg bg-primary-tint text-primary">
                  <CategoryIcon name={c.icon} size={16} />
                </span>
                {c.menuName ?? c.name}
              </Link>
              {c.children.map((child) => (
                <Link
                  key={child.id}
                  to={`/category/${child.slug}`}
                  onClick={onClose}
                  className="text-[13px] whitespace-nowrap text-menu-link hover:font-semibold hover:text-primary"
                >
                  {child.name}
                </Link>
              ))}
            </div>
          ))}
        </div>
        {promo && (
          <BannerImage banner={promo} onClick={onClose} className="w-[260px] shrink-0 self-stretch rounded-[14px]" />
        )}
      </div>
    </div>
  )
}

// Single category dropdown (Figma 85:14146).
function CategoryDropdown({ category, left, onClose }) {
  const { data: products } = useAllProducts()
  // Most sold product in the department, for the dropdown card.
  const ids = [category.id, ...category.children.map((c) => c.id)]
  const bestSeller = products?.filter((p) => ids.includes(p.categoryId)).reduce((best, p) => (!best || p.soldCount > best.soldCount ? p : best), null) ?? null
  const orderNow = useOrderNow()
  const discount = bestSeller ? discountPercent(bestSeller.price, bestSeller.oldPrice) : 0

  // pt-2 instead of a margin keeps the pointer inside the nav while moving down to the panel.
  return (
    <div style={{ left }} className="absolute top-full z-30 pt-2">
      <div className={cn(panel, 'flex gap-2.5 rounded-[14px] p-2.5')}>
        <div className="flex w-[300px] flex-col gap-0.5">
          {category.children.map((child) => (
            <Link
              key={child.id}
              to={`/category/${child.slug}`}
              onClick={onClose}
              className="group/row flex h-[46px] items-center gap-3 rounded-[10px] pr-3 pl-2.5 hover:bg-primary-tint"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface text-text group-hover/row:bg-white">
                <CategoryIcon name={child.icon} size={16} />
              </span>
              <span className="flex-1 text-[14px] font-medium text-text group-hover/row:font-semibold group-hover/row:text-primary">{child.name}</span>
              <span className="text-[12px] font-medium text-text-faint group-hover/row:text-primary">{child.productCount}</span>
              <ChevronRight size={14} className="text-text-faint group-hover/row:text-primary" />
            </Link>
          ))}
          <Link to={`/category/${category.slug}`} onClick={onClose} className="flex h-11 items-center gap-1.5 px-3 text-[13px] font-semibold text-primary">
            View all {category.menuName ?? category.name}
            <ArrowRight size={14} />
          </Link>
        </div>
        {bestSeller && (
          <div className="flex w-[240px] shrink-0 flex-col items-start gap-2.5 self-stretch rounded-xl bg-primary-wash p-4">
            <p className="text-[10.5px] font-bold text-secondary">BEST SELLER</p>
            <Link to={`/product/${bestSeller.slug}`} onClick={onClose} className="relative h-[140px] w-full overflow-hidden rounded-[10px] bg-white">
              <img src={bestSeller.images[0]} alt="" loading="lazy" decoding="async" className="size-full object-contain" />
              {discount > 0 && (
                <span className="absolute top-2 left-2 rounded-md bg-secondary px-[7px] py-[3px] text-[10.5px] font-bold text-white">{discount}% OFF</span>
              )}
            </Link>
            <Link to={`/product/${bestSeller.slug}`} onClick={onClose} className="line-clamp-2 text-[13px] font-semibold text-text hover:text-primary">
              {bestSeller.name}
            </Link>
            <p className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="text-price text-text">{formatPrice(bestSeller.price)}</span>
              {discount > 0 && <span className="text-body-sm text-text-faint line-through">{formatPrice(bestSeller.oldPrice)}</span>}
            </p>
            {bestSeller.stock > 0 && (
              <button
                type="button"
                onClick={() => {
                  onClose()
                  orderNow(bestSeller)
                }}
                className="h-[38px] w-full rounded-lg bg-primary text-[13px] font-semibold text-white"
              >
                Order Now
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Categories that don't fit in the nav row at the current width.
function MoreDropdown({ categories, left, onClose }) {
  return (
    <div style={{ left }} className="absolute top-full z-30 pt-2">
      <div className={cn(panel, 'flex w-[300px] flex-col gap-0.5 rounded-[14px] p-2.5')}>
        {categories.map((c) => (
          <Link
            key={c.id}
            to={`/category/${c.slug}`}
            onClick={onClose}
            className="group/row flex h-[46px] items-center gap-3 rounded-[10px] pr-3 pl-2.5 hover:bg-primary-tint"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface text-text group-hover/row:bg-white">
              <CategoryIcon name={c.icon} size={16} />
            </span>
            <span className="flex-1 text-[14px] font-medium text-text group-hover/row:font-semibold group-hover/row:text-primary">{c.menuName ?? c.name}</span>
            <span className="text-[12px] font-medium text-text-faint group-hover/row:text-primary">{c.productCount}</span>
            <ChevronRight size={14} className="text-text-faint group-hover/row:text-primary" />
          </Link>
        ))}
      </div>
    </div>
  )
}

export default function CategoryNav({ categories = [] }) {
  const [hover, setHover] = useState(null)
  const [megaOpen, setMegaOpen] = useState(false)
  const [visibleCount, setVisibleCount] = useState(categories.length)
  const navRef = useRef(null)
  const rowRef = useRef(null)
  const measureRef = useRef(null)
  const { data: banners = null } = useBanners()
  const hovered = categories.find((c) => c.id === hover?.id)
  const hidden = categories.slice(visibleCount)

  const close = () => {
    setHover(null)
    setMegaOpen(false)
  }

  const openDropdown = (id, el, width) => {
    if (megaOpen) return
    const nav = navRef.current.getBoundingClientRect()
    const item = el.getBoundingClientRect()
    const row = rowRef.current.getBoundingClientRect()
    setHover({ id, left: item.left - nav.left, width: item.width, max: row.right - nav.left - width })
  }

  // Measures every item in a hidden copy of the row and keeps as many as fit; the rest go under "More".
  useLayoutEffect(() => {
    const row = rowRef.current
    const measure = measureRef.current
    if (!row || !measure) return

    const fit = () => {
      const [all, more, ...items] = [...measure.children].map((el) => el.offsetWidth)
      const available = row.clientWidth - all - GAP
      const total = items.reduce((sum, w) => sum + w + GAP, 0)
      if (total - GAP <= available) return setVisibleCount(items.length)
      let used = more
      let count = 0
      while (count < items.length && used + items[count] + GAP <= available) used += items[count++] + GAP
      setVisibleCount(count)
    }

    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(row)
    return () => observer.disconnect()
  }, [categories])

  useEffect(() => {
    if (!megaOpen) return
    const onKey = (e) => e.key === 'Escape' && setMegaOpen(false)
    const onPointer = (e) => !navRef.current.contains(e.target) && setMegaOpen(false)
    window.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onPointer)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onPointer)
    }
  }, [megaOpen])

  return (
    <nav ref={navRef} aria-label="Categories" className="relative border-b border-nav-line bg-white" onMouseLeave={() => setHover(null)}>
      <div className="site-container relative">
        <ul ref={measureRef} aria-hidden="true" className="invisible absolute flex h-0 w-max overflow-hidden">
          <li className="flex items-center gap-2 text-[16px] font-bold whitespace-nowrap">
            <Menu size={18} />
            All Categories
          </li>
          <li className={itemClass}>
            More
            <ChevronDown size={14} />
          </li>
          {categories.map((c) => (
            <li key={c.id} className={itemClass}>
              {c.name}
              <ChevronDown size={14} />
            </li>
          ))}
        </ul>
        <ul ref={rowRef} className="flex h-[60px] items-center gap-6">
          <li onMouseEnter={() => setHover(null)}>
            <button
              type="button"
              onClick={() => setMegaOpen(!megaOpen)}
              aria-expanded={megaOpen}
              className={cn('flex items-center gap-2 text-[16px] font-bold whitespace-nowrap', megaOpen ? 'text-primary' : 'text-text')}
            >
              <Menu size={18} />
              All Categories
            </button>
          </li>
          {categories.slice(0, visibleCount).map((c) => (
            <li key={c.id} onMouseEnter={(e) => openDropdown(c.id, e.currentTarget, DROPDOWN_WIDTH)}>
              <NavLink
                to={`/category/${c.slug}`}
                onClick={close}
                onFocus={(e) => openDropdown(c.id, e.currentTarget, DROPDOWN_WIDTH)}
                className={({ isActive }) => cn(itemClass, (isActive || hover?.id === c.id) && 'text-primary')}
              >
                {c.name}
                <ChevronDown size={14} />
              </NavLink>
            </li>
          ))}
          {hidden.length > 0 && (
            <li onMouseEnter={(e) => openDropdown('more', e.currentTarget, MORE_WIDTH)}>
              <button
                type="button"
                onFocus={(e) => openDropdown('more', e.currentTarget, MORE_WIDTH)}
                aria-expanded={hover?.id === 'more'}
                className={cn(itemClass, hover?.id === 'more' && 'text-primary')}
              >
                More
                <ChevronDown size={14} />
              </button>
            </li>
          )}
        </ul>
      </div>

      {(megaOpen || hover) && (
        <>
          <div aria-hidden="true" onClick={close} className={cn('absolute inset-x-0 top-full z-20 h-screen bg-dark/55', !megaOpen && 'pointer-events-none')} />
          {hover && <span aria-hidden="true" style={{ left: hover.left, width: hover.width }} className="absolute -bottom-px z-30 h-0.5 bg-primary" />}
        </>
      )}
      {megaOpen && <MegaMenu categories={categories} promo={banners?.menu} onClose={close} />}
      {hovered && <CategoryDropdown key={hovered.id} category={hovered} left={Math.min(hover.left - 15, hover.max)} onClose={close} />}
      {hover?.id === 'more' && <MoreDropdown categories={hidden} left={Math.min(hover.left - 15, hover.max)} onClose={close} />}
    </nav>
  )
}
