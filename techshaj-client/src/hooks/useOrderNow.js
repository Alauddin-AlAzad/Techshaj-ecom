import { useNavigate } from 'react-router-dom'
import { useCartStore } from '../context/useCartStore.js'
import { defaultVariant } from '../lib/product.js'

// Adds one unit with the default variant and goes straight to checkout.
export function useOrderNow() {
  const addItem = useCartStore((s) => s.addItem)
  const navigate = useNavigate()

  return (product) => {
    addItem(product.id, 1, defaultVariant(product))
    navigate('/checkout')
  }
}
