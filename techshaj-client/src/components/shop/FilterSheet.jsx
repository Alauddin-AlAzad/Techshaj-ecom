import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '../../lib/cn.js'
import { toggleCategory, toggleValue as toggle } from '../../lib/shopFilters.js'
import { Chip, PriceRange, Toggle } from './FilterControls.jsx'

function Group({ title, children }) {
  return (
    <section className="flex flex-col gap-2.5">
      <h3 className="font-body text-[14px] font-bold text-text">{title}</h3>
      {children}
    </section>
  )
}

// Mobile bottom sheet (Figma 39:5531). Mount only while open; it edits a draft and nothing
// reaches the URL until "Show N products".
export default function FilterSheet({ onClose, filters, facets, emptyFilters, countFor, onApply }) {
  const [draft, setDraft] = useState(filters)
  const [allCats, setAllCats] = useState(false)

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const set = (patch) => setDraft((d) => ({ ...d, ...patch }))
  const cats = allCats ? facets.categories : facets.categories.slice(0, 4)
  const count = countFor(draft)

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
      <button type="button" aria-label="Close filters" onClick={onClose} className="absolute inset-0 bg-dark/55" />
      <div className="absolute inset-x-0 bottom-0 flex max-h-[85vh] flex-col overflow-hidden rounded-t-[20px] bg-white pb-[env(safe-area-inset-bottom)]">
        <div className="flex justify-center pt-2.5 pb-1">
          <span className="h-1 w-10 rounded-sm bg-swatch-line" />
        </div>
        <div className="flex items-center justify-between border-b border-border px-4 pt-2 pb-3">
          <h2 className="font-heading text-[18px] font-bold tracking-[-0.27px] text-text">Filters</h2>
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => setDraft(emptyFilters)} className="text-[13px] font-semibold text-primary">
              Clear all
            </button>
            <button type="button" onClick={onClose} aria-label="Close" className="text-text">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-[18px] overflow-y-auto p-4">
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-bold text-text">In stock only</span>
            <Toggle label="In stock only" checked={draft.stock} onChange={() => set({ stock: !draft.stock })} />
          </div>

          <Group title="Price (৳)">
            <PriceRange
              key={`${draft.min}-${draft.max}`}
              slider={false}
              bounds={facets.price}
              value={[draft.min ?? facets.price.min, draft.max ?? facets.price.max]}
              onCommit={([min, max]) => set({ min: min === facets.price.min ? null : min, max: max === facets.price.max ? null : max })}
              inputClassName="h-10"
            />
          </Group>

          <Group title="Category">
            <div className="flex flex-col gap-3">
              {cats.map((p) => (
                <div key={p.slug} className="flex flex-wrap gap-2">
                  <Chip active={draft.cats.includes(p.slug)} onClick={() => set({ cats: toggleCategory(draft.cats, p) })}>
                    {p.children.length ? `All ${p.name}` : p.name}
                  </Chip>
                  {p.children.map((c) => (
                    <Chip key={c.slug} active={draft.cats.includes(c.slug)} onClick={() => set({ cats: toggleCategory(draft.cats, c) })}>
                      {c.name}
                    </Chip>
                  ))}
                </div>
              ))}
              {facets.categories.length > 4 && (
                <button type="button" onClick={() => setAllCats(!allCats)} className="self-start px-1 text-label-sm text-primary">
                  {allCats ? 'Show less' : `+${facets.categories.length - 4} more`}
                </button>
              )}
            </div>
          </Group>

          <Group title="Collection">
            <div className="flex flex-wrap gap-2">
              {facets.collections.map((c) => (
                <Chip key={c.slug} active={draft.cols.includes(c.slug)} onClick={() => set({ cols: toggle(draft.cols, c.slug) })}>
                  {c.name}
                </Chip>
              ))}
            </div>
          </Group>

          {facets.colors.length > 0 && (
            <Group title="Color">
              <div className="flex flex-wrap gap-3">
                {facets.colors.map((c) => {
                  const active = draft.colors.includes(c.name)
                  return (
                    <button
                      key={c.name}
                      type="button"
                      aria-label={c.name}
                      aria-pressed={active}
                      onClick={() => set({ colors: toggle(draft.colors, c.name) })}
                      className={cn('size-[30px] rounded-full', active ? 'border-3 border-sky' : 'border border-swatch-line')}
                      style={{ backgroundColor: c.hex }}
                    />
                  )
                })}
              </div>
            </Group>
          )}

          <Group title="Brand">
            <div className="flex flex-wrap gap-2">
              {facets.brands.map((b) => (
                <Chip key={b.name} active={draft.brands.includes(b.name)} onClick={() => set({ brands: toggle(draft.brands, b.name) })}>
                  {b.name}
                </Chip>
              ))}
            </div>
          </Group>
        </div>

        <div className="flex gap-2.5 border-t border-border px-4 pt-3 pb-4">
          <button type="button" onClick={() => setDraft(emptyFilters)} className="h-12 rounded-[10px] border-[1.5px] border-text px-[22px] text-[14px] font-bold text-text">
            Reset
          </button>
          <button
            type="button"
            onClick={() => onApply(draft)}
            className="h-12 flex-1 rounded-[10px] bg-primary text-[14px] font-bold text-white"
          >
            Show {count} product{count === 1 ? '' : 's'}
          </button>
        </div>
      </div>
    </div>
  )
}
