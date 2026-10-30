import { ArrowRight, BadgePercent, ChevronDown, ChevronRight, Truck, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import storefront from '../../data/storefront.json'
import { useBranding } from '../../hooks/useSettings.js'
import { cn } from '../../lib/cn.js'
import CategoryIcon from '../CategoryIcon.jsx'
import Logo from '../Logo.jsx'
import SocialLinks from '../SocialLinks.jsx'

// Figma "Menu Drawer – Mobile 390" (39:5630).
export default function MobileMenu({ store, categories = [], onClose }) {
  const { name } = useBranding()
  const [openId, setOpenId] = useState(null)
  const popular = storefront.popularLinks

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = overflow
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button type="button" aria-label="Close menu" onClick={onClose} className="absolute inset-0 size-full bg-dark/55" />
      <div role="dialog" aria-modal="true" aria-label="Menu" className="relative flex h-full w-[340px] max-w-[87%] flex-col bg-dark">
        <div className="flex items-center justify-between border-b border-drawer-line pt-4 pr-4 pb-3.5 pl-5">
          <Link to="/" onClick={onClose} aria-label={`${name} home`}>
            <Logo size="xs" />
          </Link>
          <button type="button" onClick={onClose} aria-label="Close menu" className="flex size-[38px] items-center justify-center rounded-full bg-drawer-field text-white">
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-[22px] overflow-y-auto px-4 py-[18px]">
          <div className="flex gap-2.5">
            <Link to="/track-order" onClick={onClose} className="flex h-[42px] flex-1 items-center justify-center gap-2 rounded-[10px] bg-drawer-field text-[13px] font-semibold text-white">
              <Truck size={16} />
              Track Order
            </Link>
            <Link to="/offers" onClick={onClose} className="flex h-[42px] flex-1 items-center justify-center gap-2 rounded-[10px] bg-highlight text-[13px] font-semibold text-text">
              <BadgePercent size={16} />
              Flash Sale
            </Link>
          </div>

          {popular.length > 0 && (
            <div className="flex flex-col gap-2.5">
              <p className="text-[11px] font-bold text-text-muted">POPULAR</p>
              <div className="flex flex-wrap gap-2">
                {popular.map((l) => (
                  <Link key={l.label} to={l.to} onClick={onClose} className="flex h-8 items-center rounded-2xl border border-drawer-chip px-3 text-[12px] font-medium text-drawer-chip-text">
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between pb-1.5">
              <h2 className="text-[18px] font-bold text-white">Categories</h2>
              <Link to="/categories" onClick={onClose} className="flex items-center gap-1 text-label-sm text-primary">
                All Categories
                <ArrowRight size={14} />
              </Link>
            </div>
            {categories.map((c) => {
              const open = openId === c.id
              return (
                <div key={c.id} className={cn('rounded-xl', open && 'bg-drawer-open')}>
                  <button
                    type="button"
                    onClick={() => setOpenId(open ? null : c.id)}
                    aria-expanded={open}
                    className={cn('flex h-[52px] w-full items-center gap-3 pr-2.5 pl-2 text-left', !open && 'border-b border-drawer-row')}
                  >
                    <span className={cn('flex size-[34px] shrink-0 items-center justify-center overflow-hidden rounded-[9px] text-primary', open ? 'bg-primary text-white' : 'bg-drawer-field')}>
                      <CategoryIcon name={c.icon} image={c.image} size={17} />
                    </span>
                    <span className="flex-1 text-label text-white">{c.menuName || c.name}</span>
                    <ChevronDown size={18} className={cn('shrink-0 transition-transform', open ? 'rotate-180 text-white' : 'text-text-muted')} />
                  </button>
                  {open && (
                    <div className="flex flex-col pt-0.5 pr-2.5 pb-2.5 pl-[54px]">
                      {c.children.map((child) => (
                        <Link
                          key={child.id}
                          to={`/category/${child.slug}`}
                          onClick={onClose}
                          className="flex h-10 items-center gap-2.5 border-b border-drawer-sub-line text-[13px] font-medium text-drawer-sub"
                        >
                          {child.image && <img src={child.image} alt="" loading="lazy" decoding="async" className="size-6 shrink-0 rounded-md object-cover" />}
                          <span className="flex-1">{child.name}</span>
                          <ChevronRight size={14} className="text-text-muted" />
                        </Link>
                      ))}
                      <Link to={`/category/${c.slug}`} onClick={onClose} className="flex h-10 items-center gap-1.5 text-[13px] font-semibold text-primary">
                        View all {c.menuName || c.name}
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-drawer-line bg-text px-5 pt-3.5 pb-[calc(18px+env(safe-area-inset-bottom))]">
          <div className="flex flex-col gap-0.5 whitespace-nowrap">
            <p className="text-[11px] text-text-faint">Need help? Call us</p>
            <a href={`tel:${store?.hotline}`} className="text-[14px] font-bold text-white">
              {store?.hotline}
            </a>
          </div>
          <SocialLinks social={store?.social} size="xs" className="gap-2" />
        </div>
      </div>
    </div>
  )
}
