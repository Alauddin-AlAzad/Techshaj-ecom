import { ExternalLink, LogOut, Menu } from 'lucide-react'

const initials = (admin) =>
  (admin?.name || admin?.email || 'A')
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')

// Figma "Admin/Topbar" (54:7798).
export default function Topbar({ title, admin, onMenu, onLogout }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-nav-line bg-white px-4 lg:h-[72px] lg:gap-4 lg:px-7">
      <button type="button" onClick={onMenu} aria-label="Open menu" className="-ml-1 flex size-10 items-center justify-center rounded-full text-text hover:bg-fill lg:hidden">
        <Menu size={22} />
      </button>
      <p className="min-w-0 flex-1 truncate font-heading text-[18px] font-bold text-text lg:text-h3">{title}</p>

      <a
        href="/"
        target="_blank"
        rel="noreferrer"
        className="hidden h-10 items-center gap-2 rounded-[20px] bg-fill px-4 text-[13px] font-semibold text-text hover:bg-fill-line sm:flex"
      >
        <ExternalLink size={16} />
        View store
      </a>

      <div className="flex min-w-0 items-center gap-2.5">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-[13px] font-bold text-white">{initials(admin)}</span>
        <span className="hidden min-w-0 flex-col gap-px md:flex">
          <span className="truncate text-[13px] font-semibold text-text">{admin?.name || 'Admin'}</span>
          <span className="truncate text-[11px] text-text-muted">{admin?.email}</span>
        </span>
      </div>

      <button
        type="button"
        onClick={onLogout}
        aria-label="Log out"
        className="flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-border-strong px-2.5 text-[13px] font-semibold text-text hover:border-error hover:text-error sm:px-4"
      >
        <LogOut size={16} />
        <span className="max-sm:hidden">Logout</span>
      </button>
    </header>
  )
}
