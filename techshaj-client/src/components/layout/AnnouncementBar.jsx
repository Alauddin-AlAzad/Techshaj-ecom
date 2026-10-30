import { useLayoutEffect, useRef, useState } from 'react'
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

// Repeats the message list until one half of the track is wider than the visible area, so the loop never shows a gap.
function useCopies(wrapRef, halfRef, count, key) {
  const [copies, setCopies] = useState(2)
  useLayoutEffect(() => {
    const wrap = wrapRef.current
    const half = halfRef.current
    if (!wrap || !half || !count) return
    const fit = () => {
      const setWidth = half.scrollWidth / half.dataset.copies
      if (!setWidth) return
      setCopies(Math.max(2, Math.ceil(wrap.clientWidth / setWidth) + 1))
    }
    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(wrap)
    return () => observer.disconnect()
  }, [wrapRef, halfRef, count, key])
  return copies
}

// Thin bar above the navbar: fixed items on the sides, a marquee in the middle that always runs right to left.
// It ignores hover and reduced-motion on purpose: the bar must keep moving on every device.
export default function AnnouncementBar({ settings }) {
  const wrapRef = useRef(null)
  const halfRef = useRef(null)
  const topBar = topBarOf(settings)
  const messages = settings ? marqueeMessages(topBar, settings.freeShippingThreshold) : []
  const copies = useCopies(wrapRef, halfRef, messages.length, messages.map((m) => m.text).join('|'))
  if (!settings || topBar.enabled === false) return null
  const left = (topBar.left ?? []).slice(0, 2)
  const right = (topBar.right ?? []).slice(0, 3)
  if (!messages.length && !left.length && !right.length) return null

  const half = Array.from({ length: copies }, () => messages).flat()
  const seconds = (TOP_BAR_SPEEDS.find((s) => s.value === topBar.speed) ?? TOP_BAR_SPEEDS[1]).seconds

  return (
    <div className="bg-primary text-[13px] font-semibold text-white lg:text-[14px]">
      <div className="site-container flex h-[30px] items-center gap-6 max-lg:px-0 lg:h-10">
        <FixedItems items={left} />
        <div ref={wrapRef} className="relative h-full min-w-0 flex-1 overflow-hidden lg:[mask-image:linear-gradient(to_right,transparent,black_24px,black_calc(100%-24px),transparent)]">
          {messages.length > 0 && (
            <>
              <ul className="sr-only">
                {messages.map((m, i) => (
                  <li key={i}>
                    <BarLink href={m.link}>{m.text}</BarLink>
                  </li>
                ))}
              </ul>
              <div aria-hidden="true" style={{ animationDuration: `${seconds}s` }} className="flex h-full w-max animate-marquee items-center">
                <div ref={halfRef} data-copies={copies} className="flex shrink-0">
                  <Track messages={half} />
                </div>
                <div className="flex shrink-0">
                  <Track messages={half} />
                </div>
              </div>
            </>
          )}
        </div>
        <FixedItems items={right} />
      </div>
    </div>
  )
}
