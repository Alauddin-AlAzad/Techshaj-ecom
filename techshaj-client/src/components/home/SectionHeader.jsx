import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '../../lib/cn.js'

// Multi-word titles get the last word in primary, as in every Figma section header.
function Title({ text }) {
  const i = text.lastIndexOf(' ')
  if (i < 0) return text
  return (
    <>
      {text.slice(0, i + 1)}
      <span className="text-primary">{text.slice(i + 1)}</span>
    </>
  )
}

export default function SectionHeader({ title, tag, seeAllTo, seeAllLabel = 'See All', mobileSeeAllLabel, nav }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-2.5">
        <h2 className="truncate font-heading text-[19px] font-bold tracking-[-0.285px] text-text lg:text-[26px] lg:tracking-[-0.39px]">
          <Title text={title} />
        </h2>
        {tag && (
          <span className="rounded bg-highlight px-2 py-[3px] text-[10px] font-extrabold text-text lg:text-[12px]">{tag}</span>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-4">
        {seeAllTo && (
          <Link to={seeAllTo} className="flex items-center gap-0.5 text-[13px] font-semibold text-primary lg:gap-1 lg:text-label">
            <span className="lg:hidden">{mobileSeeAllLabel ?? seeAllLabel}</span>
            <span className="hidden lg:inline">{seeAllLabel}</span>
            <ChevronRight className="size-3.5 lg:size-4" />
          </Link>
        )}
        {nav && (
          <div className="hidden items-center gap-4 lg:flex">
            <button
              type="button"
              onClick={nav.prev}
              disabled={nav.atStart}
              aria-label="Previous"
              className="flex size-8 items-center justify-center rounded-full border border-border-strong text-text disabled:opacity-40"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={nav.next}
              disabled={nav.atEnd}
              aria-label="Next"
              className={cn('flex size-8 items-center justify-center rounded-full bg-text text-white disabled:opacity-40')}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
