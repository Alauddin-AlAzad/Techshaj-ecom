import { cn } from '../lib/cn.js'

export default function CountBadge({ count, className }) {
  return (
    <span
      className={cn(
        'absolute flex size-[18px] items-center justify-center rounded-full bg-highlight text-[10px] font-bold text-text',
        className,
      )}
    >
      {count > 9 ? '9+' : count}
    </span>
  )
}
