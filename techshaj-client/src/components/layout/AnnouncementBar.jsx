import { Link } from 'react-router-dom'
import { cn } from '../../lib/cn.js'
import { TOP_BAR_SPEEDS, marqueeMessages, topBarOf } from '../../lib/topBar.js'

// "/" paths use the router, tel:/mailto: stay in the tab, other links open a new tab.
function BarLink({ href, className, tabIndex, children }) {
  if (!href) return <span className={className}>{children}</span>
  if (href.startsWith('/')) {
    return (
      <Link to={href} tabIndex={tabIndex} className={cn('hover:underline', className)}>
        {children}
      </Link>
    )
  }
  const external = /^https?:\/\//i.test(href)
  return (
    <a href={href} tabIndex={tabIndex} {...(external && { target: '_blank', rel: 'noopener noreferrer' })} className={cn('hover:underline', className)}>
      {children}
    </a>
  )
}

function FixedItems({ items, className }) {
  if (!items?.length) return null
  return (
    <ul className={cn('hidden shrink-0 items-center gap-4 lg:flex', className)}>
      {items.map((item, i) => (
        <li key={i} className="whitespace-nowrap">
          <BarLink href={item.href}>{item.label}</BarLink>
        </li>
      ))}
    </ul>
  )
}

function Track({ messages }) {
  return (
    <div className="flex shrink-0 items-center">
      {messages.map((m, i) => (
        <span key={i} className="flex items-center whitespace-nowrap">
          <BarLink href={m.link} tabIndex={-1}>
            {m.text}
          </BarLink>
          <span aria-hidden="true" className="px-6">
            •
          </span>
        </span>
      ))}
    </div>
  )
}

// Thin bar above the navbar: fixed items on the sides, a looping marquee in the middle.
export default function AnnouncementBar({ settings }) {
  const topBar = topBarOf(settings)
  if (!settings || topBar.enabled === false) return null
  const messages = marqueeMessages(topBar, settings.freeShippingThreshold)
  const left = (topBar.left ?? []).slice(0, 2)
  const right = (topBar.right ?? []).slice(0, 3)
  if (!messages.length && !left.length && !right.length) return null

  // Enough copies to cover wide screens; the track is two equal halves that slide by -50%.
  const copies = Math.max(2, Math.ceil(6 / Math.max(messages.length, 1)))
  const half = Array.from({ length: copies }, () => messages).flat()
  const seconds = (TOP_BAR_SPEEDS.find((s) => s.value === topBar.speed) ?? TOP_BAR_SPEEDS[1]).seconds * half.length

  return (
    <div className="bg-primary text-[12px] font-semibold text-white lg:text-[13px]">
      <div className="site-container flex h-[30px] items-center gap-6 max-lg:px-0 lg:h-[34px]">
        <FixedItems items={left} />
        <div className="relative h-full min-w-0 flex-1 overflow-hidden lg:[mask-image:linear-gradient(to_right,transparent,black_24px,black_calc(100%-24px),transparent)]">
          {messages.length > 0 && (
            <>
              <ul className="sr-only">
                {messages.map((m, i) => (
                  <li key={i}>
                    <BarLink href={m.link}>{m.text}</BarLink>
                  </li>
                ))}
              </ul>
              <div
                aria-hidden="true"
                style={{ animationDuration: `${seconds}s` }}
                className="flex h-full w-max animate-marquee items-center hover:[animation-play-state:paused] motion-reduce:animate-none"
              >
                <Track messages={half} />
                <Track messages={half} />
              </div>
            </>
          )}
        </div>
        <FixedItems items={right} />
      </div>
    </div>
  )
}
