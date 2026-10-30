import Breadcrumbs from '../Breadcrumbs.jsx'

// Figma "Page Hero" of the info pages: centered with breadcrumbs on desktop (42:6408), left-aligned on mobile (43:7154).
export default function PageHero({ title, subtitle, crumb }) {
  return (
    <section className="bg-surface">
      <div className="site-container flex flex-col gap-1.5 pt-5 pb-5 lg:items-center lg:gap-2.5 lg:py-9 lg:text-center">
        <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: crumb ?? title }]} className="hidden lg:flex lg:text-[13px]" />
        <h1 className="text-[24px] font-bold tracking-[-0.36px] text-text lg:text-[36px] lg:tracking-[-0.54px]">{title}</h1>
        {subtitle && <p className="text-body leading-5 text-text-muted lg:text-[15px] lg:leading-normal">{subtitle}</p>}
      </div>
    </section>
  )
}
