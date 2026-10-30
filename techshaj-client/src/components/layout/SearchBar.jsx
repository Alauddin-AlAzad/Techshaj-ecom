import { Search } from 'lucide-react'
import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useSearchStore } from '../../context/useSearchStore.js'
import { useProductSearch } from '../../hooks/useProductSearch.js'
import { cn } from '../../lib/cn.js'
import SearchResults from '../search/SearchResults.jsx'

// Desktop header search with the live dropdown (Figma 39:5294).
export default function SearchBar({ placeholder, className, iconClassName }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const wrapRef = useRef(null)
  const inputRef = useRef(null)
  const navigate = useNavigate()
  const addRecent = useSearchStore((s) => s.addRecent)
  const { total, results } = useProductSearch(query)
  const showDropdown = open && query.trim().length > 0

  const close = () => {
    setOpen(false)
    setActive(-1)
  }

  const finish = (q) => {
    addRecent(q)
    close()
    inputRef.current?.blur()
  }

  const submit = (e) => {
    e.preventDefault()
    if (active >= 0 && active < results.length) {
      finish(query)
      navigate(`/product/${results[active].slug}`)
      return
    }
    const q = query.trim()
    finish(q)
    navigate(q ? `/shop?q=${encodeURIComponent(q)}` : '/shop')
  }

  const onKeyDown = (e) => {
    const last = total > results.length ? results.length : results.length - 1
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setActive((i) => (i >= last ? 0 : i + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => (i <= 0 ? last : i - 1))
    } else if (e.key === 'Escape') {
      close()
      inputRef.current?.blur()
    }
  }

  return (
    <>
      {showDropdown && createPortal(<div className="fixed inset-0 z-30 bg-dark/35" onClick={close} aria-hidden="true" />, document.body)}
      <div
        ref={wrapRef}
        className={cn('relative bg-dark-field', className)}
        onBlur={(e) => !wrapRef.current?.contains(e.relatedTarget) && close()}
      >
        <form role="search" onSubmit={submit} className="flex size-full items-center gap-[inherit]">
          <Search className={cn('shrink-0 text-text-faint', iconClassName)} />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setOpen(true)
              setActive(-1)
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            aria-label="Search products"
            aria-expanded={showDropdown}
            aria-autocomplete="list"
            role="combobox"
            className="h-full min-w-0 flex-1 bg-transparent text-body text-white outline-none placeholder:text-text-faint [&::-webkit-search-cancel-button]:hidden"
          />
        </form>

        {showDropdown && (
          <div className="absolute inset-x-0 top-full mt-2 overflow-hidden rounded-xl bg-white shadow-[0_12px_32px_rgba(0,0,0,0.18)]">
            <div className="flex justify-between px-3.5 pt-3 pb-2 text-body-sm">
              <span className="font-semibold text-text-muted">
                {total} result{total === 1 ? '' : 's'} for “{query.trim()}”
              </span>
              <span className="text-text-faint">Esc to close</span>
            </div>
            {total > 0 ? (
              <SearchResults query={query} results={results} total={total} activeIndex={active} onSelect={finish} />
            ) : (
              <p className="px-3.5 pt-2 pb-5 text-body text-text-muted">No products found. Try a product name or code like TS-PB-019.</p>
            )}
          </div>
        )}
      </div>
    </>
  )
}
