import { Search, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { cn } from '../../lib/cn.js'

// Figma top bar search (54:7908). onChange fires 400ms after the last keystroke.
export default function SearchInput({ value = '', onChange, placeholder = 'Search…', delay = 400, className }) {
  const [text, setText] = useState(value)
  const [synced, setSynced] = useState(value)
  const timer = useRef(null)

  // Follow outside changes to value, e.g. a reset filter or browser back.
  if (value !== synced) {
    setSynced(value)
    setText(value)
  }

  useEffect(() => () => clearTimeout(timer.current), [])

  const update = (next, wait) => {
    setText(next)
    clearTimeout(timer.current)
    const emit = () => {
      setSynced(next.trim())
      onChange(next.trim())
    }
    if (wait) timer.current = setTimeout(emit, wait)
    else emit()
  }

  return (
    <div className={cn('flex h-10 items-center gap-2 rounded-[20px] bg-fill px-3.5 focus-within:ring-2 focus-within:ring-primary-soft', className)}>
      <Search size={16} className="shrink-0 text-text-faint" />
      <input
        type="search"
        value={text}
        onChange={(e) => update(e.target.value, delay)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="min-w-0 flex-1 bg-transparent text-[13px] text-text outline-none placeholder:text-text-faint [&::-webkit-search-cancel-button]:hidden"
      />
      {text && (
        <button type="button" aria-label="Clear search" onClick={() => update('', 0)} className="text-text-faint hover:text-text">
          <X size={14} />
        </button>
      )}
    </div>
  )
}
