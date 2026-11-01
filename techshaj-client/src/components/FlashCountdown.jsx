import { Fragment } from 'react'
import { useCountdown } from '../hooks/useCountdown.js'

// Days, hours, minutes and seconds with a small label under each number. Used on the home Flash Sale and the Offers page.
export default function FlashCountdown({ endsAt }) {
  const t = useCountdown(endsAt)
  const units = [
    [t.days, 'Days'],
    [t.hours, 'Hours'],
    [t.mins, 'Mins'],
    [t.secs, 'Secs'],
  ]

  return (
    <div role="timer" aria-label="Time left in flash sale" className="flex items-center gap-0.5 lg:gap-1.5">
      {units.map(([value, label], i) => (
        <Fragment key={label}>
          {i > 0 && <span className="text-[11px] font-bold text-white lg:text-[16px]">:</span>}
          <span className="flex h-8 w-[28px] flex-col items-center justify-center rounded-md bg-primary-tint text-primary tabular-nums lg:h-12 lg:w-[52px]">
            <span className="text-[12px] leading-none font-bold lg:text-[19px]">{value}</span>
            <span className="mt-px text-[6px] leading-none font-semibold text-text-muted uppercase lg:text-[9px]">{label}</span>
          </span>
        </Fragment>
      ))}
    </div>
  )
}
