import { ClipboardList, FolderTree, Image, LayoutDashboard, MessageSquareText, Package, Settings, Ticket, UserRound, Zap } from 'lucide-react'

// Sidebar groups from Figma "Admin/Sidebar" (54:7629).
export const navGroups = [
  {
    label: 'MAIN',
    links: [
      { to: '/admin', label: 'Dashboard', Icon: LayoutDashboard, end: true },
      { to: '/admin/orders', label: 'Orders', Icon: ClipboardList },
    ],
  },
  {
    label: 'CATALOG',
    links: [
      { to: '/admin/products', label: 'Products', Icon: Package },
      { to: '/admin/categories', label: 'Categories', Icon: FolderTree },
      { to: '/admin/flash-sale', label: 'Flash Sale', Icon: Zap },
      { to: '/admin/reviews', label: 'Reviews', Icon: MessageSquareText },
    ],
  },
  {
    label: 'STOREFRONT',
    links: [{ to: '/admin/banners', label: 'Banners', Icon: Image }],
  },
  {
    label: 'MARKETING & SETTINGS',
    links: [
      { to: '/admin/coupons', label: 'Coupons', Icon: Ticket },
      { to: '/admin/settings', label: 'Settings', Icon: Settings },
      { to: '/admin/account', label: 'Account', Icon: UserRound },
    ],
  },
]

const links = navGroups.flatMap((g) => g.links)

// Top bar title for the current section, e.g. /admin/orders/TS123 -> "Orders".
export function sectionTitle(pathname) {
  const match = links.filter((l) => (l.end ? pathname === l.to || pathname === `${l.to}/` : pathname.startsWith(l.to))).at(-1)
  return match?.label ?? 'Admin'
}
