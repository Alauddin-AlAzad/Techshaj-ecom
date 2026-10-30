import { ChevronDown, Mail, MapPin } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getProductsByIds } from '../../data/api.js'
import { useAsync } from '../../hooks/useAsync.js'
import { cn } from '../../lib/cn.js'
import Logo from '../Logo.jsx'
import SocialLinks from '../SocialLinks.jsx'

const year = new Date().getFullYear()

const toProductLinks = (products) => (products ?? []).map((p) => ({ label: p.name, to: `/product/${p.slug}` }))

function LinkColumn({ title, links }) {
  return (
    <div className="flex flex-1 flex-col items-start gap-3">
      <h3 className="font-body text-[15px] font-bold text-white">{title}</h3>
      {links.map((l) => (
        <Link key={l.to} to={l.to} className="text-body text-on-dark hover:text-white">
          {l.label}
        </Link>
      ))}
    </div>
  )
}

function ProductColumn({ title, links }) {
  return (
    <div className="flex flex-1 flex-col items-start gap-2.5">
      <h3 className="font-body text-[12px] font-bold tracking-[0.72px] text-white uppercase">{title}</h3>
      {links.map((l) => (
        <Link key={l.to} to={l.to} className="text-[13px] text-on-dark hover:text-white">
          {l.label}
        </Link>
      ))}
    </div>
  )
}

function DesktopFooter({ store, bestSelling, bestDeals }) {
  return (
    <div className="site-container hidden lg:block">
      <div className="flex items-start gap-12 pt-14 pb-10">
        <div className="flex flex-1 flex-col items-start gap-3">
          <Logo />
          <p className="text-[13px] text-text-faint">Hotline 24/7</p>
          <a href={`tel:${store?.hotline}`} className="text-[22px] font-bold whitespace-nowrap text-white">
            {store?.hotline}
          </a>
          <p className="flex items-center gap-2.5 text-body text-on-dark">
            <MapPin size={16} className="shrink-0" />
            {store?.address}
          </p>
          <a href={`mailto:${store?.email}`} className="flex items-center gap-2.5 text-body text-on-dark hover:text-white">
            <Mail size={16} className="shrink-0" />
            {store?.email}
          </a>
        </div>
        <LinkColumn title="Useful Links" links={store?.footerLinks?.useful ?? []} />
        <LinkColumn title="Help Center" links={store?.footerLinks?.help ?? []} />
        <div className="flex flex-1 flex-col items-start gap-3.5">
          <h3 className="font-body text-[15px] font-bold text-white">Social Media</h3>
          <SocialLinks social={store?.social} />
        </div>
      </div>

      <div className="flex items-start gap-12 border-t border-dark-line pt-7 pb-8">
        <ProductColumn title="Best Selling" links={bestSelling} />
        <ProductColumn title="Best Deals" links={bestDeals} />
      </div>

      <div className="flex h-16 items-center justify-between border-t border-dark-line">
        <p className="text-[13px] text-text-faint">© {year} TechShaj. All rights reserved.</p>
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-white">Pay with</span>
          {store?.paymentMethods?.map((m) => (
            <span key={m.name} className="rounded-[5px] bg-white px-2.5 py-[5px] text-[12px] font-bold text-text">
              {m.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function AccordionItem({ title, links }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border-b border-dark-line">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex w-full items-center justify-between py-3.5 text-label text-white">
        {title}
        <ChevronDown size={16} className={cn('transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="flex flex-col items-start gap-2.5 pb-3.5">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className="text-[13px] text-on-dark">
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function MobileFooter({ store, bestSelling, bestDeals }) {
  return (
    <div className="flex flex-col items-start gap-3 px-4 pt-7 pb-24 lg:hidden">
      <Logo size="sm" />
      <p className="text-body-sm text-text-faint">Hotline 24/7</p>
      <a href={`tel:${store?.hotline}`} className="text-[20px] font-bold text-white">
        {store?.hotline}
      </a>
      <p className="flex items-center gap-2 text-[13px] text-on-dark">
        <MapPin size={15} className="shrink-0" />
        {store?.address}
      </p>
      <div className="py-1">
        <SocialLinks social={store?.social} size="sm" />
      </div>
      <div className="w-full border-t border-dark-line">
        <AccordionItem title="Useful Links" links={store?.footerLinks?.useful ?? []} />
        <AccordionItem title="Help Center" links={store?.footerLinks?.help ?? []} />
        <AccordionItem title="Best Selling" links={bestSelling} />
        <AccordionItem title="Best Deals" links={bestDeals} />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {store?.paymentMethods?.map((m) => (
          <span key={m.name} className="rounded-[5px] bg-white px-2 py-1 text-[11px] font-bold text-text">
            {m.shortName ?? m.name}
          </span>
        ))}
      </div>
      <p className="text-body-sm text-text-faint">© {year} TechShaj. All rights reserved.</p>
    </div>
  )
}

export default function Footer({ store }) {
  const ids = store?.footerProducts
  const bestSelling = toProductLinks(useAsync(() => getProductsByIds(ids?.bestSelling), [ids]))
  const bestDeals = toProductLinks(useAsync(() => getProductsByIds(ids?.bestDeals), [ids]))
  const props = { store, bestSelling, bestDeals }

  return (
    <footer className="bg-dark">
      <MobileFooter {...props} />
      <DesktopFooter {...props} />
    </footer>
  )
}
