import { BadgePercent, ChevronDown, CircleCheck, X } from 'lucide-react'
import { useState } from 'react'
import { formatPrice } from '../../lib/format.js'
import { FieldError } from './Field.jsx'

// Coupon field (31:3584). The applied code lives in the parent so totals can use it.
export default function CouponBox({ applied, error, discount, onApply, onRemove, onClear }) {
  const [code, setCode] = useState('')
  const [open, setOpen] = useState(false)

  if (applied && !error) {
    return (
      <div className="flex h-11 items-center gap-2 rounded-lg border border-success bg-success-tint pr-1.5 pl-3 text-[13px] text-success">
        <CircleCheck size={17} className="shrink-0" />
        <span className="flex-1">
          <b className="font-bold">{applied}</b> applied · −{formatPrice(discount)}
        </span>
        <button type="button" onClick={onRemove} aria-label="Remove coupon" className="flex size-8 items-center justify-center rounded-md text-success hover:bg-white">
          <X size={16} />
        </button>
      </div>
    )
  }

  const apply = () => code.trim() && onApply(code.trim().toUpperCase())

  if (!open && !error) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded="false"
        className="flex items-center gap-1.5 self-start py-1 font-bangla text-[13px] font-semibold text-primary"
      >
        <BadgePercent size={16} className="shrink-0" />
        কুপন কোড আছে?
        <ChevronDown size={15} className="shrink-0" />
      </button>
    )
  }

  const close = () => {
    setCode('')
    setOpen(false)
    onClear?.()
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex h-11 items-center gap-2 rounded-lg border border-border-strong pr-1.5 pl-3 focus-within:border-primary">
        <BadgePercent className="size-[17px] shrink-0 text-primary lg:size-[18px]" />
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              apply()
            }
          }}
          placeholder="Coupon / Promo Code"
          aria-label="Coupon code"
          autoFocus
          className="min-w-0 flex-1 bg-transparent text-[13px] text-text uppercase outline-none placeholder:text-text-faint placeholder:normal-case"
        />
        <button type="button" onClick={apply} className="rounded-md bg-text px-3 py-[7px] text-body-sm font-bold text-white">
          Apply
        </button>
        <button type="button" onClick={close} aria-label="Close coupon" className="flex size-8 shrink-0 items-center justify-center rounded-md text-text-muted hover:bg-fill">
          <X size={16} />
        </button>
      </div>
      <FieldError message={error} className="font-body" />
    </div>
  )
}
