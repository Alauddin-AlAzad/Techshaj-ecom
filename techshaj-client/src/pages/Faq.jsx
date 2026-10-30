import { ChevronDown, MessageCircle, Search } from 'lucide-react'
import { useState } from 'react'
import PageHero from '../components/info/PageHero.jsx'
import RichText from '../components/info/RichText.jsx'
import { getPage, getStore } from '../data/api.js'
import { useAsync } from '../hooks/useAsync.js'
import { cn } from '../lib/cn.js'
import { usePageTitle } from '../hooks/usePageTitle.js'

async function loadFaq() {
  const [page, store] = await Promise.all([getPage('faq'), getStore()])
  return { page, store }
}

function FaqItem({ item, open, onToggle }) {
  const id = `faq-${item.question.replace(/\W+/g, '-').toLowerCase()}`
  return (
    <li className={cn('rounded-xl border border-border', open && 'border-[1.5px] border-primary bg-faq-open')}>
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={onToggle}
          className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left font-body text-body font-semibold text-text lg:px-5 lg:py-[18px] lg:text-body-lg"
        >
          {item.question}
          <ChevronDown size={18} className={cn('shrink-0 text-text-muted transition-transform', open && 'rotate-180 text-primary')} />
        </button>
      </h3>
      {open && (
        <p id={id} className="-mt-1.5 px-4 pb-4 text-[13px] leading-5 text-text-secondary lg:-mt-2 lg:px-5 lg:pb-[18px] lg:text-body lg:leading-[22px]">
          <RichText text={item.answer} />
        </p>
      )}
    </li>
  )
}

// Figma "FAQ" desktop (42:6853) and mobile (43:7383).
export default function Faq() {
  usePageTitle('FAQ')
  const data = useAsync(loadFaq)
  const [query, setQuery] = useState('')
  const [topic, setTopic] = useState('all')
  const [openQuestion, setOpenQuestion] = useState(null)

  if (!data) return <div className="min-h-[60vh]" />
  const { page, store } = data
  const q = query.trim().toLowerCase()
  const items = page.items.filter(
    (i) => (topic === 'all' || i.topic === topic) && (!q || i.question.toLowerCase().includes(q) || i.answer.toLowerCase().includes(q)),
  )
  // The first question starts open, as in the design.
  const open = openQuestion ?? page.items[0].question

  return (
    <>
      <PageHero title={page.hero.title} subtitle={page.hero.subtitle} crumb="FAQ" />
      <div className="mx-auto flex max-w-[892px] flex-col gap-3.5 px-4 pt-5 pb-7 lg:items-center lg:gap-5 lg:pt-12 lg:pb-[72px]">
        <label className="flex h-12 w-full items-center gap-2.5 rounded-3xl border border-border-strong px-[18px] focus-within:border-primary">
          <Search size={18} className="shrink-0 text-text-faint" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search questions…"
            aria-label="Search questions"
            className="min-w-0 flex-1 bg-transparent text-body text-text outline-none placeholder:text-text-faint"
          />
        </label>

        <div role="tablist" aria-label="FAQ topics" className="-mx-4 flex gap-2 overflow-x-auto px-4 no-scrollbar lg:mx-0 lg:px-0">
          {[{ id: 'all', label: 'All' }, ...page.topics].map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={topic === t.id}
              onClick={() => setTopic(t.id)}
              className={cn('shrink-0 rounded-[18px] px-4 py-2 text-[13px] font-semibold', topic === t.id ? 'bg-text text-white' : 'bg-fill text-text-secondary hover:bg-fill-line')}
            >
              {t.label}
            </button>
          ))}
        </div>

        {items.length ? (
          <ul className="flex w-full flex-col gap-2.5 lg:gap-5">
            {items.map((item) => (
              <FaqItem key={item.question} item={item} open={open === item.question} onToggle={() => setOpenQuestion(open === item.question ? '' : item.question)} />
            ))}
          </ul>
        ) : (
          <p className="w-full py-10 text-center text-body text-text-muted">No questions match your search.</p>
        )}

        <div className="flex w-full flex-col items-start gap-3.5 rounded-[14px] bg-dark p-5 lg:flex-row lg:items-center lg:justify-between lg:px-6 lg:py-[22px]">
          <div className="flex flex-col gap-1">
            <p className="font-heading text-[18px] font-bold tracking-[-0.27px] text-white">{page.help.title}</p>
            <p className="text-[13px] text-on-dark">{page.help.text}</p>
          </div>
          <a
            href={`https://wa.me/${store.whatsapp}`}
            target="_blank"
            rel="noreferrer"
            className="flex h-11 shrink-0 items-center gap-2 rounded-[10px] bg-whatsapp px-[18px] text-[13px] font-bold text-white"
          >
            <MessageCircle size={17} />
            {page.help.cta}
          </a>
        </div>
      </div>
    </>
  )
}
