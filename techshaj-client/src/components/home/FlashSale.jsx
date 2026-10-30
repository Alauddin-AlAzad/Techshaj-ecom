import { Zap } from 'lucide-react'
import { Fragment } from 'react'
import { useCountdown } from '../../hooks/useCountdown.js'
import { ProductSwiper } from './ProductRow.jsx'

function Countdown({ endsAt }) {
  const t = useCountdown(endsAt)
  const units = [
    [t.days, 'DAYS'],
    [t.hours, 'HOURS'],
    [t.mins, 'MINS'],
    [t.secs, 'SECS'],
  ]

  return (
    <div role="timer" aria-label="Time left in flash sale" className="flex items-center gap-2 rounded-lg border border-secondary px-3 py-1.5 lg:gap-2.5 lg:px-[18px] lg:py-2">
      {units.map(([value, label], i) => (
        <Fragment key={label}>
          {i > 0 && <span className="text-[16px] font-bold text-white lg:text-[20px]">:</span>}
          <span className="flex w-[38px] flex-col items-center lg:w-11">
            <span className="text-[18px] font-bold text-white tabular-nums lg:text-[24px]">{value}</span>
            <span className="text-[9px] font-semibold tracking-[0.54px] text-flash-muted lg:text-[10px] lg:tracking-[0.6px]">{label}</span>
          </span>
        </Fragment>
      ))}
    </div>
  )
}

export default function FlashSale({ flashSale }) {
  if (!flashSale?.products?.length) return null

  return (
    <section className="site-container pt-7 lg:pt-12">
      <div className="overflow-hidden rounded-[14px] border border-nav-line bg-white">
        <div className="flex flex-col items-start gap-3 bg-flash p-3.5 lg:h-[100px] lg:flex-row lg:items-center lg:justify-between lg:px-7 lg:py-0">
          <div className="flex items-center gap-2.5 lg:gap-3">
            <Zap className="size-6 text-highlight lg:size-[30px]" />
            <div className="flex flex-col gap-0.5">
              <h2 className="font-heading text-[18px] font-bold tracking-[-0.27px] text-white lg:text-[26px] lg:tracking-[-0.39px]">{flashSale.title}</h2>
              <p className="text-[11px] text-flash-muted lg:text-[13px]">Big discounts on top products</p>
            </div>
          </div>
          <Countdown endsAt={flashSale.endsAt} />
        </div>
        <div className="p-3 lg:p-5">
          <ProductSwiper products={flashSale.products} gap={14} inset={false} />
        </div>
      </div>
    </section>
  )
}
