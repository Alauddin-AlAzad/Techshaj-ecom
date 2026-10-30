import { cn } from '../../lib/cn.js'

// Underlined tabs with counts, Figma "Reviews" and "Banners" tab rows (62:10260, 61:9340).
// tabs: [{ value, label, count? }]
export default function Tabs({ tabs, value, onChange, label, className }) {
  return (
    <div role="tablist" aria-label={label} className={cn('no-scrollbar -mx-4 flex gap-6 overflow-x-auto border-b border-border-strong px-4 lg:mx-0 lg:px-0', className)}>
      {tabs.map((tab) => {
        const active = tab.value === value
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.value)}
            className={cn(
              '-mb-px flex shrink-0 items-center gap-1.5 border-b-2 pt-2.5 pb-3 text-[14px] whitespace-nowrap transition-colors',
              active ? 'border-primary font-bold text-text' : 'border-transparent font-medium text-text-muted hover:text-text',
            )}
          >
            {tab.label}
            {tab.count != null && (
              <span className={cn('rounded-[10px] px-[7px] py-px text-[11px] font-bold', active ? 'bg-text text-white' : 'bg-border text-text-secondary')}>{tab.count}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
