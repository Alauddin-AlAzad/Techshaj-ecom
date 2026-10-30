import { ChevronDown } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useUpdateProduct } from '../../hooks/useAdminProducts.js'
import { cn } from '../../lib/cn.js'
import { notify } from '../../lib/notify.jsx'
import { STOCK_MODES, nextStock } from '../../lib/stock.js'
import { errorMessage } from '../../lib/query.js'
import Button from './Button.jsx'
import StockBadge from './StockBadge.jsx'
import { inputClass } from './inputClass.js'

const WIDTH = 272

// The row's stock badge opens a small popover to set, add or remove stock.
// It renders in a portal so the table's scroll container does not clip it.
export default function StockEditor({ product }) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState('add')
  const [amount, setAmount] = useState('')
  const [position, setPosition] = useState(null)
  const buttonRef = useRef(null)
  const panelRef = useRef(null)
  const update = useUpdateProduct()
  const current = product.stock ?? 0
  const next = nextStock(current, mode, amount)
  const valid = amount !== '' && Number(amount) >= 0 && Number.isInteger(Number(amount))

  const close = () => {
    setOpen(false)
    buttonRef.current?.focus()
  }

  useLayoutEffect(() => {
    if (!open) return
    const place = () => {
      const r = buttonRef.current.getBoundingClientRect()
      const left = Math.min(Math.max(8, r.left), window.innerWidth - WIDTH - 8)
      const below = r.bottom + 6
      const height = panelRef.current?.offsetHeight ?? 260
      setPosition({ left, top: below + height > window.innerHeight - 8 ? Math.max(8, r.top - height - 6) : below })
    }
    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      if (!panelRef.current?.contains(e.target) && !buttonRef.current?.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      setOpen(false)
      buttonRef.current?.focus()
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const toggle = () => {
    if (!open) {
      setMode('add')
      setAmount('')
    }
    setOpen((o) => !o)
  }

  const submit = (e) => {
    e.preventDefault()
    if (!valid) return
    if (next === current) {
      notify.info(`Stock is already ${current}`)
      return close()
    }
    update.mutate(
      { id: product.id, data: { stock: next } },
      {
        onSuccess: (p) => {
          notify.success(`Stock is now ${p.stock}`, { description: p.name })
          close()
        },
        onError: (error) => notify.error('Could not update stock', { description: errorMessage(error) }),
      },
    )
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Stock ${current}. Change stock of ${product.name}`}
        className="group flex items-center gap-1 rounded-[10px] outline-none focus-visible:ring-2 focus-visible:ring-primary-soft"
      >
        <StockBadge stock={current} className="group-hover:underline" />
        <ChevronDown size={14} className={cn('text-text-faint transition-transform', open && 'rotate-180')} />
      </button>
      {open &&
        createPortal(
          <form
            ref={panelRef}
            role="dialog"
            aria-label={`Update stock of ${product.name}`}
            onSubmit={submit}
            style={{ left: position?.left ?? -9999, top: position?.top ?? 0, width: WIDTH }}
            className="fixed z-[55] flex flex-col gap-3 rounded-xl border border-border bg-white p-3.5 shadow-menu"
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[13px] font-semibold text-text">Current stock</span>
              <span className="text-[18px] font-bold text-text">{current}</span>
            </div>
            <div role="radiogroup" aria-label="How to change stock" className="grid grid-cols-3 gap-1 rounded-lg bg-fill p-1">
              {STOCK_MODES.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  role="radio"
                  aria-checked={mode === m.value}
                  onClick={() => setMode(m.value)}
                  className={cn('h-8 rounded-md text-[12px] font-semibold', mode === m.value ? 'bg-white text-text shadow-sm' : 'text-text-muted hover:text-text')}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <input
              type="number"
              inputMode="numeric"
              min="0"
              step="1"
              autoFocus
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={mode === 'set' ? 'New stock' : 'How many'}
              aria-label={mode === 'set' ? 'New stock' : mode === 'add' ? 'Quantity to add' : 'Quantity to remove'}
              className={cn(inputClass(), 'h-10')}
            />
            <p className="text-body-sm text-text-muted">
              New stock: <span className="font-bold text-text">{valid ? next : '—'}</span>
              {mode === 'remove' && valid && Number(amount) > current && ' (cannot go below 0)'}
            </p>
            <Button type="submit" loading={update.isPending} disabled={!valid} className="w-full">
              Save
            </Button>
          </form>,
          document.body,
        )}
    </>
  )
}
