import { Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCartStore } from '../../context/useCartStore.js'
import { variantLabel } from '../../lib/cart.js'
import { formatPrice } from '../../lib/format.js'
import QtyStepper from './QtyStepper.jsx'

// Figma cart item: mobile cart (33:3432) below lg, cart drawer (31:3351) from lg.
export default function CartItem({ line, onNavigate }) {
  const updateQty = useCartStore((s) => s.updateQty)
  const removeItem = useCartStore((s) => s.removeItem)
  const { product, qty, variant, key } = line
  const variantText = variantLabel(variant)

  return (
    <li className="flex items-start gap-3 border-b border-border px-4 py-3.5 lg:gap-3.5 lg:px-5 lg:py-4">
      <Link to={`/product/${product.slug}`} onClick={onNavigate} className="size-[72px] shrink-0 overflow-hidden rounded-lg bg-fill lg:size-[76px]">
        <img src={product.images[0]} alt="" className="size-full object-contain mix-blend-multiply" />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col items-start gap-[5px] lg:gap-1.5">
        <Link to={`/product/${product.slug}`} onClick={onNavigate} className="text-[13px] leading-[18px] font-semibold text-text hover:text-primary lg:text-label lg:leading-normal">
          {product.name}
        </Link>
        {variantText && <p className="text-[11px] text-text-muted lg:text-body-sm">Variant: {variantText}</p>}
        <p className="flex items-center gap-1.5 whitespace-nowrap lg:gap-2">
          <span className="text-[14px] font-bold text-text lg:text-[15px]">{formatPrice(product.price)}</span>
          {product.oldPrice > product.price && <span className="text-[11px] text-text-faint line-through lg:text-body-sm">{formatPrice(product.oldPrice)}</span>}
        </p>
        <div className="flex w-full items-center justify-between">
          <QtyStepper value={qty} max={product.stock} onChange={(n) => updateQty(key, n)} />
          <button type="button" onClick={() => removeItem(key)} aria-label={`Remove ${product.name}`} className="flex items-center gap-1 text-body-sm font-medium text-error">
            <Trash2 className="size-4 lg:size-[15px]" />
            <span className="hidden lg:inline">Remove</span>
          </button>
        </div>
      </div>
    </li>
  )
}
