import { ExternalLink, LogOut, X } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { cn } from '../../lib/cn.js'
import Logo from '../Logo.jsx'
import { navGroups } from './nav.js'

// Figma "Admin/Sidebar" (54:7629).
export default function Sidebar({ onClose, onLogout }) {
  return (
    <nav aria-label="Admin" className="flex h-full w-[260px] flex-col gap-0.5 overflow-y-auto bg-dark px-3.5 py-5">
      <div className="flex items-center justify-between gap-2 px-1.5 pb-[18px]">
        <div className="flex items-center gap-2">
          <Logo size="sm" />
          <span className="rounded bg-highlight px-1.5 py-0.5 text-[10px] font-bold text-text">ADMIN</span>
        </div>
        {onClose && (
          <button type="button" onClick={onClose} aria-label="Close menu" className="flex size-11 items-center justify-center rounded-full bg-drawer-field text-white lg:hidden">
            <X size={18} />
          </button>
        )}
      </div>

      {navGroups.map((group) => (
        <div key={group.label} className="flex flex-col gap-0.5">
          <p className="px-2.5 pt-3.5 pb-1.5 text-[11px] font-semibold text-text-muted">{group.label}</p>
          {group.links.map(({ to, label, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-body font-medium text-on-dark transition-colors hover:bg-drawer-row hover:text-white',
                  isActive && 'bg-drawer-field font-semibold text-white hover:bg-drawer-field',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={18} className={cn('shrink-0', isActive && 'text-primary')} />
                  <span className="flex-1">{label}</span>
                  {isActive && <span aria-hidden="true" className="h-4 w-1 rounded-full bg-primary" />}
                </>
              )}
            </NavLink>
          ))}
        </div>
      ))}

      <div className="mt-auto flex flex-col gap-0.5 pt-4 lg:hidden">
        <a href="/" target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-body font-medium text-on-dark hover:bg-drawer-row hover:text-white">
          <ExternalLink size={18} />
          View store
        </a>
        <button type="button" onClick={onLogout} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-body font-medium text-on-dark hover:bg-drawer-row hover:text-white">
          <LogOut size={18} />
          Log out
        </button>
      </div>
    </nav>
  )
}
