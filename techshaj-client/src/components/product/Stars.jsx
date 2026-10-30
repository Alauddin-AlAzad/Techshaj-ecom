import { Star } from 'lucide-react'
import { cn } from '../../lib/cn.js'

export default function Stars({ rating, className }) {
  const filled = Math.round(rating)
  return (
    <span className="flex gap-0.5 lg:gap-[3px]" aria-label={`${rating} out of 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className={cn('size-3.5 lg:size-4', i < filled ? 'fill-highlight text-highlight' : 'fill-fill-line text-fill-line', className)} />
      ))}
    </span>
  )
}
