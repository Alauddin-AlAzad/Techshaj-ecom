import { CreditCard, ShieldCheck, Truck, Wrench } from 'lucide-react'
import PageHero from '../components/info/PageHero.jsx'
import { TINTS } from '../components/info/tints.js'
import Logo from '../components/Logo.jsx'
import { getPage } from '../data/api.js'
import { useAsync } from '../hooks/useAsync.js'
import { cn } from '../lib/cn.js'
import { usePageTitle } from '../hooks/usePageTitle.js'

const ICONS = { 'shield-check': ShieldCheck, truck: Truck, 'credit-card': CreditCard, wrench: Wrench }

// Figma "About Us" desktop (42:6334) and mobile (43:7125).
export default function About() {
  usePageTitle('About Us')
  const page = useAsync(() => getPage('about'))
  if (!page) return <div className="min-h-[60vh]" />
  const { hero, story, values, numbers } = page

  return (
    <>
      <PageHero title={hero.title} subtitle={hero.subtitle} crumb="About Us" />
      <div className="site-container flex flex-col gap-3.5 pt-5 pb-7 lg:gap-12 lg:pt-12 lg:pb-[72px]">
        <section className="flex flex-col gap-3.5 lg:flex-row-reverse lg:items-center lg:gap-12">
          <div className="flex h-[180px] items-center justify-center rounded-2xl bg-dark lg:h-[340px] lg:w-[520px] lg:shrink-0">
            <Logo size="md" className="lg:hidden" />
            <Logo size="xl" className="hidden lg:flex" />
          </div>
          <div className="flex flex-col gap-3.5 lg:flex-1 lg:gap-4">
            <p className="text-[11px] font-bold tracking-[0.88px] text-primary lg:text-label-sm lg:font-bold lg:tracking-[0.96px]">{story.eyebrow}</p>
            <h2 className="text-[20px] font-bold tracking-[-0.3px] text-text lg:text-[30px] lg:tracking-[-0.45px]">{story.title}</h2>
            <p className="text-body leading-[22px] text-text-secondary lg:text-[15px] lg:leading-[26px]">
              <span className="lg:hidden">{story.mobileBody}</span>
              <span className="hidden lg:inline">{story.body}</span>
            </p>
            {story.note && <p className="hidden text-[15px] leading-[26px] text-text-faint lg:block">{story.note}</p>}
          </div>
        </section>

        <ul className="grid grid-cols-2 gap-2.5 lg:grid-cols-4 lg:gap-4">
          {values.map((v) => {
            const Icon = ICONS[v.icon]
            return (
              <li key={v.title} className="flex flex-col items-start gap-2 rounded-xl border border-border p-3.5 lg:gap-2.5 lg:rounded-[14px] lg:px-[22px] lg:py-6">
                <span className={cn('flex size-10 items-center justify-center rounded-[10px] lg:size-12 lg:rounded-xl', TINTS[v.tint])}>
                  <Icon className="size-5 lg:size-6" />
                </span>
                <span className="text-[13px] font-bold text-text lg:font-heading lg:text-[17px] lg:tracking-[-0.255px]">{v.title}</span>
                <span className="hidden text-[13px] text-text-muted lg:block">{v.text}</span>
              </li>
            )
          })}
        </ul>

        <ul className="hidden items-start justify-between rounded-2xl bg-dark px-10 py-8 lg:flex">
          {numbers.map((n) => (
            <li key={n.label} className="flex flex-col items-center gap-1">
              <span className={cn('text-[32px] font-extrabold', n.highlight ? 'text-highlight' : 'text-white')}>{n.value}</span>
              <span className="text-[13px] text-on-dark">{n.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}
