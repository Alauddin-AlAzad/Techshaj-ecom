import { BadgePercent, CreditCard, ShieldCheck, Truck, Wrench } from 'lucide-react'

const badges = [
  { Icon: ShieldCheck, label: '100% Genuine Products', short: '100% Genuine' },
  { Icon: Truck, label: 'Fastest Home Delivery', short: 'Fast Delivery' },
  { Icon: BadgePercent, label: 'Best Price Deals', short: 'Best Price' },
  { Icon: Wrench, label: 'After-Sales Service', short: 'After-Sales' },
  { Icon: CreditCard, label: 'Payment Secure', short: 'Secure Payment' },
]

export default function TrustBadges() {
  return (
    <section className="lg:site-container pt-3.5 lg:pt-5">
      <ul className="no-scrollbar flex gap-2 overflow-x-auto px-4 lg:h-[62px] lg:items-center lg:justify-between lg:rounded-[10px] lg:bg-surface lg:px-8">
        {badges.map(({ Icon, label, short }) => (
          <li key={label} className="flex shrink-0 items-center gap-1.5 rounded-lg bg-surface px-3 py-[9px] text-label-sm text-text lg:gap-2.5 lg:bg-transparent lg:p-0 lg:text-label">
            <Icon className="size-4 text-primary lg:size-5" />
            <span className="lg:hidden">{short}</span>
            <span className="hidden lg:inline">{label}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
