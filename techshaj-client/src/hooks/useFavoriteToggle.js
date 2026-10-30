import { useFavoriteStore } from '../context/useFavoriteStore.js'
import { notify } from '../lib/notify.jsx'

// Toggles a product in favorites and confirms with an Undo toast.
export function useFavoriteToggle(product) {
  const isFavorite = useFavoriteStore((s) => s.ids.includes(product.id))
  const toggleId = useFavoriteStore((s) => s.toggle)

  const toggle = () => {
    toggleId(product.id)
    const undo = { label: 'Undo', onClick: () => toggleId(product.id) }
    if (isFavorite) notify.wish('Removed from wishlist', { description: product.name, action: undo })
    else notify.wish('Saved to wishlist', { description: 'You can find it under Favorite', action: undo })
  }

  return [isFavorite, toggle]
}
