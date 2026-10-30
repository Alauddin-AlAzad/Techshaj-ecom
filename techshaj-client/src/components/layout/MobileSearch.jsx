import { ArrowLeft, Clock, Search, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSearchStore } from '../../context/useSearchStore.js'
import { useProductSearch } from '../../hooks/useProductSearch.js'
import SearchResults from '../search/SearchResults.jsx'

// Full-screen mobile search (Figma 39:5435).
export default function MobileSearch({ onClose }) {
  const [query, setQuery] = useState('')
  const inputRef = useRef(null)
  const navigate = useNavigate()
  const { recent, addRecent, clearRecent } = useSearchStore()
  const { total, results } = useProductSearch(query)
  const q = query.trim()

  useEffect(() => {
    inputRef.current?.focus()
    document.body.style.overflow = 'hidden'
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const finish = (value) => {
    addRecent(value)
    onClose()
  }

  return (
    <div role="dialog" aria-modal="true" aria-label="Search" className="fixed inset-0 z-50 overflow-y-auto bg-white lg:hidden">
      <div className="sticky top-0 flex items-center gap-2.5 bg-dark py-3.5 pr-4 pl-3">
        <button type="button" onClick={onClose} aria-label="Close search" className="text-white">
          <ArrowLeft size={22} />
        </button>
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault()
            if (!q) return
            finish(q)
            navigate(`/shop?q=${encodeURIComponent(q)}`)
          }}
          className="flex h-[42px] min-w-0 flex-1 items-center gap-2.5 rounded-[22px] bg-dark-field pr-3 pl-3.5"
        >
          <Search size={17} className="shrink-0 text-text-faint" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products…"
            aria-label="Search products"
            className="min-w-0 flex-1 bg-transparent text-body font-medium text-white outline-none placeholder:font-normal placeholder:text-text-faint [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} aria-label="Clear search" className="text-text-faint">
              <X size={16} />
            </button>
          )}
        </form>
      </div>

      {recent.length > 0 && (
        <div className="flex flex-col gap-2.5 px-4 pt-4 pb-1">
          <div className="flex justify-between">
            <h2 className="font-body text-[13px] font-bold text-text">Recent searches</h2>
            <button type="button" onClick={clearRecent} className="text-label-sm text-primary">
              Clear
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {recent.map((r) => (
              <button key={r} type="button" onClick={() => setQuery(r)} className="flex items-center gap-1.5 rounded-2xl bg-fill px-2.5 py-1.5 text-body-sm font-medium text-text-secondary">
                <Clock size={13} />
                {r}
              </button>
            ))}
          </div>
        </div>
      )}

      {q && (
        <>
          <p className="px-4 pt-3.5 pb-1.5 text-label-sm text-text-muted">
            {total} result{total === 1 ? '' : 's'} for “{q}”
          </p>
          {total > 0 ? (
            <SearchResults mobile query={query} results={results} total={total} onSelect={finish} />
          ) : (
            <p className="px-4 py-6 text-body text-text-muted">No products found. Try a product name or code like TS-PB-019.</p>
          )}
        </>
      )}
    </div>
  )
}
