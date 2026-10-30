import { ArrowRight, Search } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import Breadcrumbs from '../components/Breadcrumbs.jsx'
import CategoryIcon from '../components/CategoryIcon.jsx'
import { getCategories } from '../data/api.js'
import { useAsync } from '../hooks/useAsync.js'
import { cn } from '../lib/cn.js'

function Group({ department, children }) {
  const count = children.length
  return (
    <section id={department.slug} className="scroll-mt-4 pt-7 lg:pt-12">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2.5 lg:gap-3.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-primary text-white lg:size-11 lg:rounded-xl">
            <CategoryIcon name={department.icon} className="size-[18px] lg:size-[22px]" />
          </span>
          <div className="flex min-w-0 flex-col gap-0.5">
            <h2 className="font-heading text-[15px] font-bold text-text lg:text-h3">{department.name}</h2>
            <p className="text-[11px] text-text-muted lg:text-[13px]">
              {count} sub-categor{count === 1 ? 'y' : 'ies'}
            </p>
          </div>
        </div>
        <Link to={`/category/${department.slug}`} className="flex shrink-0 items-center gap-1 text-label-sm text-primary lg:text-[13px]">
          <span className="lg:hidden">View all</span>
          <span className="hidden lg:inline">View all products</span>
          <ArrowRight className="size-3.5 lg:size-4" />
        </Link>
      </div>
      <ul className="mt-3.5 grid grid-cols-3 gap-[11px] lg:mt-5 lg:grid-cols-6 lg:gap-4">
        {children.map((c) => (
          <li key={c.id}>
            <Link
              to={`/category/${c.slug}`}
              className="flex h-[132px] flex-col items-center justify-center gap-2 rounded-xl border border-border bg-surface px-2 pt-3.5 pb-3 text-center transition hover:border-[1.5px] hover:border-primary hover:bg-white hover:shadow-[0_8px_24px_color-mix(in_srgb,var(--color-secondary)_12%,transparent)] lg:h-[184px] lg:gap-3 lg:rounded-[14px] lg:px-3.5 lg:pt-6 lg:pb-5"
            >
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full border border-border bg-white text-text-secondary lg:size-[68px]">
                <CategoryIcon name={c.icon} className="size-[22px] lg:size-[30px]" />
              </span>
              <span className="text-label-sm text-text lg:text-label">{c.name}</span>
              <span className="text-[11px] text-text-muted lg:text-body-sm">
                {c.productCount} product{c.productCount === 1 ? '' : 's'}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default function Categories() {
  const tree = useAsync(getCategories)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState('all')
  if (!tree) return <div className="min-h-[60vh]" />

  const q = query.trim().toLowerCase()
  const groups = tree
    .map((d) => ({ department: d, children: q ? d.children.filter((c) => c.name.toLowerCase().includes(q)) : d.children }))
    .filter((g) => g.children.length)
  const total = tree.reduce((n, d) => n + d.children.length, 0)

  const chip = (key, label) => (
    <button
      key={key}
      type="button"
      aria-pressed={active === key}
      onClick={() => {
        setActive(key)
        const target = key === 'all' ? document.getElementById('category-groups') : document.getElementById(key)
        target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }}
      className={cn(
        'h-[34px] shrink-0 rounded-[19px] px-3.5 text-label-sm whitespace-nowrap lg:h-[38px] lg:px-[18px] lg:text-[13px]',
        active === key ? 'bg-text text-white' : 'border border-border-strong bg-white text-text-secondary hover:border-text',
      )}
    >
      {label}
    </button>
  )

  return (
    <div className="pb-10 lg:pb-[88px]">
      <div className="bg-surface">
        <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'All Categories' }]} className="site-container py-3 lg:py-3.5" />
      </div>

      <div className="site-container">
        <div className="flex flex-col items-start gap-3 pt-6 lg:items-center lg:gap-3.5 lg:pt-12 lg:text-center">
          <h1 className="font-heading text-[26px] font-bold text-text lg:text-h1">
            All <span className="text-primary">Categories</span>
          </h1>
          <p className="text-[13px] text-text-muted lg:text-[15px]">
            <span className="lg:hidden">
              {total} categories in {tree.length} departments
            </span>
            <span className="hidden lg:inline">
              {total} categories across {tree.length} departments. Pick one and start shopping.
            </span>
          </p>
          <label className="flex h-11 w-full items-center gap-2 rounded-[22px] border border-border-strong bg-white px-3.5 focus-within:border-primary lg:h-12 lg:w-[520px] lg:gap-2.5 lg:rounded-3xl lg:px-[18px]">
            <Search className="size-4 shrink-0 text-text-faint lg:size-[18px]" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find a category, e.g. power bank"
              aria-label="Find a category"
              className="min-w-0 flex-1 bg-transparent text-[13px] text-text outline-none placeholder:text-text-faint lg:text-body"
            />
          </label>
          <div className="no-scrollbar -mx-4 flex w-[calc(100%+32px)] gap-2 overflow-x-auto px-4 lg:mx-0 lg:w-full lg:flex-wrap lg:justify-center lg:px-0">
            {chip('all', 'All')}
            {tree.map((d) => chip(d.slug, d.shortName ?? d.name))}
          </div>
        </div>

        <div id="category-groups" className="scroll-mt-4">
          {groups.length ? (
            groups.map((g) => <Group key={g.department.id} {...g} />)
          ) : (
            <p className="pt-12 text-center text-body text-text-muted">No categories match “{query}”.</p>
          )}
        </div>
      </div>
    </div>
  )
}
