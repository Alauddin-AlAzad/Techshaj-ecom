import { Package } from 'lucide-react'
import { categoryIcons } from '../lib/categoryIcons.js'

// The category picture when it has one, otherwise its icon. Image tiles need overflow-hidden.
export default function CategoryIcon({ name, image, ...props }) {
  if (image) return <img src={image} alt="" loading="lazy" decoding="async" className="size-full object-cover" />
  const Icon = categoryIcons[name] ?? Package
  return <Icon {...props} />
}
