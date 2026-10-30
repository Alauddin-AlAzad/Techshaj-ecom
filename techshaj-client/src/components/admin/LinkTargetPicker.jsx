import { Check, ExternalLink, ImageOff, X } from 'lucide-react'
import { useState } from 'react'
import { useAdminProductSearch } from '../../hooks/useAdminProducts.js'
import { LINK_COLLECTIONS, LINK_PAGES, LINK_TARGETS, linkFromTarget } from '../../lib/bannerLink.js'
import { cn } from '../../lib/cn.js'
import FormField from './FormField.jsx'
import SearchInput from './SearchInput.jsx'
import Select from './Select.jsx'
import Spinner from './Spinner.jsx'
import { inputClass } from './inputClass.js'

const selectClass = '[&_select]:h-12 [&_select]:rounded-[10px] [&_select]:text-body'

function Thumb({ src }) {
  return (
    <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-fill text-text-faint">
      {src ? <img src={src} alt="" className="size-full object-cover" /> : <ImageOff size={16} />}
    </span>
  )
}

function ProductPicker({ value, products, onChange, error }) {
  const [search, setSearch] = useState('')
  const { data: results = [], isFetching } = useAdminProductSearch(search)
  const selected = products?.find((p) => p.slug === value)

  return (
    <div className="flex flex-col gap-2">
      {value && (
        <div className={cn('flex items-center gap-3 rounded-[10px] border p-2.5', selected ? 'border-primary-soft bg-primary-wash' : 'border-error-line bg-error-wash')}>
          <Thumb src={selected?.images?.[0]} />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-[13px] font-semibold text-text">{selected?.name ?? 'Product not found'}</span>
            <span className="truncate text-[11px] text-text-muted">{selected?.code ?? value}</span>
          </span>
          <button type="button" onClick={() => onChange('')} aria-label="Clear product" className="flex size-11 items-center justify-center rounded-lg text-text-muted hover:bg-white md:size-9">
            <X size={16} />
          </button>
        </div>
      )}
      <SearchInput value={search} onChange={setSearch} placeholder="Search product by name or code" className="h-12 rounded-[10px] border border-border-strong bg-white" />
      {search && (
        <ul className="max-h-[240px] overflow-y-auto rounded-[10px] border border-border">
          {isFetching && !results.length ? (
            <li className="flex justify-center py-4 text-primary">
              <Spinner size={18} />
            </li>
          ) : results.length === 0 ? (
            <li className="px-3 py-3 text-body-sm text-text-muted">No products match "{search}".</li>
          ) : (
            results.map((p) => (
              <li key={p.id} className="border-b border-row-line last:border-b-0">
                <button
                  type="button"
                  onClick={() => {
                    onChange(p.slug)
                    setSearch('')
                  }}
                  className="flex min-h-11 w-full items-center gap-3 px-2.5 py-2 text-left hover:bg-fill-soft"
                >
                  <Thumb src={p.images?.[0]} />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-[13px] font-semibold text-text">{p.name}</span>
                    <span className="text-[11px] text-text-muted">
                      {p.code}
                      {p.published === false && ' · Draft'}
                    </span>
                  </span>
                  {p.slug === value && <Check size={16} className="text-primary" />}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
      {error && <p className="text-body-sm font-medium text-error">{error}</p>}
    </div>
  )
}

// "When someone clicks this banner, go to": value is linkTarget { type, value }.
export default function LinkTargetPicker({ value, onChange, categories = [], products, error }) {
  const type = value?.type ?? 'none'
  const set = (patch) => onChange({ type, value: '', ...patch })
  const link = linkFromTarget(value)

  return (
    <div className="flex flex-col gap-3">
      <FormField label="When someone clicks this banner, go to" htmlFor="banner-target">
        <Select id="banner-target" className={selectClass} value={type} onChange={(e) => set({ type: e.target.value, value: e.target.value === 'custom' ? value?.value ?? '' : '' })}>
          {LINK_TARGETS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </Select>
      </FormField>

      {type === 'category' && (
        <Select aria-label="Category" className={selectClass} value={value.value} error={error} onChange={(e) => set({ value: e.target.value })}>
          <option value="">Choose a category</option>
          {value.value && !categories.some((p) => p.slug === value.value || p.children.some((c) => c.slug === value.value)) && <option value={value.value}>{value.value} (missing)</option>}
          {categories.map((parent) =>
            parent.children.length ? (
              <optgroup key={parent.id} label={parent.name}>
                <option value={parent.slug}>{parent.name} (all)</option>
                {parent.children.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </optgroup>
            ) : (
              <option key={parent.id} value={parent.slug}>
                {parent.name}
              </option>
            ),
          )}
        </Select>
      )}

      {type === 'product' && <ProductPicker value={value.value} products={products} onChange={(slug) => set({ value: slug })} error={error} />}

      {type === 'collection' && (
        <Select aria-label="Collection" className={selectClass} value={value.value} error={error} onChange={(e) => set({ value: e.target.value })}>
          <option value="">Choose a collection</option>
          {LINK_COLLECTIONS.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </Select>
      )}

      {type === 'page' && (
        <Select aria-label="Page" className={selectClass} value={value.value} error={error} onChange={(e) => set({ value: e.target.value })}>
          <option value="">Choose a page</option>
          {LINK_PAGES.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </Select>
      )}

      {type === 'custom' && (
        <input aria-label="Custom link" placeholder="/shop?q=moon%20lamp or https://…" aria-invalid={Boolean(error)} value={value.value} onChange={(e) => set({ value: e.target.value })} className={inputClass(error)} />
      )}

      {error && type !== 'product' && <p className="text-body-sm font-medium text-error">{error}</p>}

      <p className="flex min-w-0 items-center gap-1.5 text-body-sm text-text-muted">
        <ExternalLink size={13} className="shrink-0" />
        <span className="shrink-0">Opens:</span>
        <code className="truncate rounded bg-fill px-1.5 py-0.5 text-[12px] text-text-secondary">{link || 'nothing (image only)'}</code>
      </p>
    </div>
  )
}
