import { ChevronDown, Menu } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { cn } from '../../lib/cn.js'
import CategoryIcon from '../CategoryIcon.jsx'

export default function CategoryNav({ categories = [] }) {
  const [openId, setOpenId] = useState(null)
  const open = categories.find((c) => c.id === openId)
  const close = () => setOpenId(null)

  return (
    <nav aria-label="Categories" className="relative border-b border-nav-line bg-white" onMouseLeave={close}>
      <div className="site-container">
        <ul className="no-scrollbar flex h-[50px] items-center gap-7 overflow-x-auto">
          <li onMouseEnter={close}>
            <Link to="/categories" onClick={close} className="flex items-center gap-2 text-[14px] font-bold whitespace-nowrap text-text">
              <Menu size={18} />
              All Categories
            </Link>
          </li>
          {categories.map((c) => (
            <li key={c.id} onMouseEnter={() => setOpenId(c.id)}>
              <NavLink
                to={`/category/${c.slug}`}
                onClick={close}
                onFocus={() => setOpenId(c.id)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-1 text-[13.5px] font-medium whitespace-nowrap text-text-secondary hover:text-primary',
                    (isActive || openId === c.id) && 'text-primary',
                  )
                }
              >
                {c.name}
                <ChevronDown size={14} />
              </NavLink>
            </li>
          ))}
        </ul>
      </div>

      {open && (
        <div className="absolute inset-x-0 top-full z-30 border-b border-border bg-white shadow-lg">
          <ul className="site-container grid grid-cols-4 gap-x-6 gap-y-1 py-5">
            {open.children.map((child) => (
              <li key={child.id}>
                <Link
                  to={`/category/${child.slug}`}
                  onClick={close}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-label text-text hover:bg-primary-tint hover:text-primary"
                >
                  <CategoryIcon name={child.icon} size={18} className="text-primary" />
                  {child.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </nav>
  )
}
