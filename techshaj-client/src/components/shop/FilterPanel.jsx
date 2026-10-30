import { useState } from 'react'
import { toggleValue as toggle } from '../../lib/shopFilters.js'
import { CheckRow, PriceRange } from './FilterControls.jsx'

function Section({ title, children }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="font-body text-[14px] font-bold text-text">{title}</h3>
      {children}
    </section>
  )
}

function ExpandableList({ items, limit = 10, render }) {
  const [open, setOpen] = useState(false)
  const shown = open ? items : items.slice(0, limit)
  return (
    <>
      {shown.map(render)}
      {items.length > limit && (
        <button type="button" onClick={() => setOpen(!open)} className="self-start text-[13px] font-semibold text-primary">
          {open ? 'Show less' : `Show ${items.length - limit} more`}
        </button>
      )}
    </>
  )
}

// Desktop sidebar (Figma 27:3337). Every change is written to the URL immediately.
export default function FilterPanel({ filters: f, facets, onChange, onClear }) {
  return (
    <aside aria-label="Filters" className="flex flex-col gap-[22px] rounded-xl border border-border p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-body text-price">Filters</h2>
        <button type="button" onClick={onClear} className="text-[13px] font-semibold text-primary">
          Clear all
        </button>
      </div>

      <Section title="Availability">
        <CheckRow label="In stock only" checked={f.stock} onChange={() => onChange({ stock: !f.stock })} />
      </Section>

      <Section title="Price (৳)">
        <PriceRange
          key={`${f.min}-${f.max}`}
          bounds={facets.price}
          value={[f.min ?? facets.price.min, f.max ?? facets.price.max]}
          onCommit={([min, max]) =>
            onChange({ min: min === facets.price.min ? null : min, max: max === facets.price.max ? null : max })
          }
          inputClassName="h-[38px]"
        />
      </Section>

      <Section title="Category">
        <ExpandableList
          items={facets.categories}
          render={(c) => (
            <CheckRow key={c.slug} label={c.name} count={c.count} checked={f.cats.includes(c.slug)} onChange={() => onChange({ cats: toggle(f.cats, c.slug) })} />
          )}
        />
      </Section>

      <Section title="Collection">
        {facets.collections.map((c) => (
          <CheckRow key={c.slug} label={c.name} count={c.count} checked={f.cols.includes(c.slug)} onChange={() => onChange({ cols: toggle(f.cols, c.slug) })} />
        ))}
      </Section>

      {facets.colors.length > 0 && (
        <Section title="Color">
          {facets.colors.map((c) => (
            <CheckRow
              key={c.name}
              label={c.name}
              count={c.count}
              swatch={c.hex}
              checked={f.colors.includes(c.name)}
              onChange={() => onChange({ colors: toggle(f.colors, c.name) })}
            />
          ))}
        </Section>
      )}

      <Section title="Brand">
        <ExpandableList
          items={facets.brands}
          limit={6}
          render={(b) => (
            <CheckRow key={b.name} label={b.name} count={b.count} checked={f.brands.includes(b.name)} onChange={() => onChange({ brands: toggle(f.brands, b.name) })} />
          )}
        />
      </Section>
    </aside>
  )
}

