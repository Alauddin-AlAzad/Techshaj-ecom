import { ShoppingCart } from 'lucide-react'
import EmptyState from '../EmptyState.jsx'

export default function EmptyCart({ onNavigate }) {
  return (
    <EmptyState
      Icon={ShoppingCart}
      title="Your cart is empty"
      text="Looks like you have not added anything yet. Explore our latest gadgets and deals."
      onNavigate={onNavigate}
    />
  )
}
