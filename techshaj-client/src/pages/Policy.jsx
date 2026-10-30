import { ChevronRight } from 'lucide-react'
import { Link, NavLink, useParams } from 'react-router-dom'
import PageHero from '../components/info/PageHero.jsx'
import ErrorState from '../components/ErrorState.jsx'
import pages from '../data/pages.json'
import { useSettings } from '../hooks/useSettings.js'
import { cn } from '../lib/cn.js'
import { formatPrice } from '../lib/format.js'
import NotFound from './NotFound.jsx'
import { usePageTitle } from '../hooks/usePageTitle.js'

// Delivery charges from the store's shipping zones, plus the free shipping threshold.
function Charges({ store }) {
  const cards = [
    ...store.shippingZones.map((z) => ({ label: z.name, value: formatPrice(z.charge), note: z.days ?? '', className: 'bg-primary-tint' })),
    { label: `Orders over ${formatPrice(store.freeShippingThreshold)}`, value: 'Free', note: 'All over Bangladesh', className: 'bg-highlight-soft', heading: true },
  ]
  return (
    <ul className="flex flex-col gap-2.5 lg:grid lg:grid-cols-4 lg:gap-3.5">
      {cards.map((c) => (
        <li key={c.label} className={cn('flex items-center justify-between gap-3 rounded-xl px-3.5 py-3 lg:flex-col lg:items-start lg:gap-1 lg:p-[18px]', c.className)}>
          <span className="flex flex-col gap-1 lg:contents">
            <span className="text-[13px] font-semibold text-text-secondary">{c.label}</span>
            <span className="text-[11px] text-text-muted lg:order-last lg:text-body-sm">{c.note.replace('-', '–')}</span>
          </span>
          <span className={cn('text-[22px] font-extrabold text-text lg:text-[26px]', c.heading && 'font-heading font-bold tracking-[-0.39px]')}>{c.value}</span>
        </li>
      ))}
    </ul>
  )
}

// Figma "Policy" desktop (42:7072) and mobile (43:7518). One page for shipping, return, privacy and terms.
export default function Policy() {
  const { type } = useParams()
  const { data: store, isError, refetch } = useSettings()
  const policies = pages.policies
  usePageTitle(policies[type]?.title)

  if (!store && isError) return <ErrorState onRetry={refetch} />
  if (!store) return <div className="min-h-[60vh]" />
  const policy = policies[type]
  if (!policy) return <NotFound />
  const entries = Object.entries(policies)

  return (
    <>
      <PageHero title={policy.title} subtitle={policy.updated} />
      <div className="site-container flex flex-col gap-3.5 pt-5 pb-7 lg:flex-row lg:items-start lg:gap-10 lg:pt-12 lg:pb-[72px]">
        <nav aria-label="Policies" className="-mx-4 flex gap-2 overflow-x-auto px-4 no-scrollbar lg:hidden">
          {entries.map(([key, p]) => (
            <NavLink
              key={key}
              to={`/policy/${key}`}
              className={({ isActive }) => cn('shrink-0 rounded-2xl px-3.5 py-2 text-body-sm font-semibold', isActive ? 'bg-text text-white' : 'bg-fill text-text-secondary')}
            >
              {p.tab}
            </NavLink>
          ))}
        </nav>
        <nav aria-label="Policies" className="hidden w-[280px] shrink-0 flex-col gap-0.5 rounded-xl border border-border p-2 lg:flex">
          {[...entries.map(([key, p]) => ({ to: `/policy/${key}`, label: p.title })), { to: '/faq', label: 'FAQ' }].map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                cn('flex items-center justify-between rounded-lg px-3.5 py-3 text-body', isActive ? 'bg-text font-bold text-white' : 'font-medium text-text-secondary hover:bg-fill-soft')
              }
            >
              {l.label}
              <ChevronRight size={15} />
            </NavLink>
          ))}
        </nav>

        <article className="flex min-w-0 flex-1 flex-col gap-3.5 lg:gap-[22px]">
          {policy.showCharges && <Charges store={store} />}
          {policy.sections.map((s, i) => (
            <section key={s.title} className="flex flex-col gap-2 lg:gap-[22px]">
              <h2 className="font-body text-[16px] font-bold text-text lg:text-[20px]">
                {i + 1}. {s.title}
              </h2>
              <p className={cn('text-body leading-[22px] lg:text-[15px] lg:leading-[26px]', s.placeholder ? 'text-text-faint' : 'text-text-secondary')}>{s.body}</p>
            </section>
          ))}
          <p className="text-[13px] text-text-muted lg:hidden">
            More questions? See the <Link to="/faq" className="font-semibold text-primary">FAQ</Link>.
          </p>
        </article>
      </div>
    </>
  )
}
