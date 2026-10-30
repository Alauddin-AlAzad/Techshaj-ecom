import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '../../lib/cn.js'
import CategoryIcon from '../CategoryIcon.jsx'
import { bannerThemes } from './bannerThemes.js'

// Desktop only; the mobile Home frame has no promo row.
export default function PromoBanners({ promos }) {
  if (!promos?.length) return null

  return (
    <section className="site-container hidden gap-4 pt-12 lg:flex">
      {promos.map((p) => {
        const theme = bannerThemes[p.theme] ?? bannerThemes.blue
        return (
          <Link key={p.id} to={p.link} className={cn('flex h-[140px] min-w-0 flex-1 items-center justify-between rounded-[14px] px-8', theme.bg)}>
            <div className="flex flex-col items-start gap-2">
              <span className={cn('text-[12px] font-bold tracking-[0.72px]', theme.eyebrow)}>{p.eyebrow}</span>
              <p className="font-heading text-[24px] font-bold tracking-[-0.36px] text-text">{p.title}</p>
              <span className="flex items-center gap-1 text-label text-text">
                Shop now
                <ArrowRight size={16} />
              </span>
            </div>
            <CategoryIcon name={p.icon} absoluteStrokeWidth className={cn('size-[72px] shrink-0', theme.icon)} />
          </Link>
        )
      })}
    </section>
  )
}
