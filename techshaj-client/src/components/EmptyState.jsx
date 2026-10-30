import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

// Figma "Empty Cart" (40:6398) layout, reused for other empty lists.
export default function EmptyState({ Icon, title, text, cta = 'Start shopping', to = '/shop', onNavigate }) {
  return (
    <div className="flex flex-col items-center gap-3.5 px-6 py-10 text-center">
      <span className="flex size-24 items-center justify-center rounded-full bg-primary-tint text-primary">
        <Icon size={42} strokeWidth={1.75} />
      </span>
      <h2 className="text-[20px] font-bold tracking-[-0.3px] text-text">{title}</h2>
      <p className="max-w-[342px] text-body text-text-muted">{text}</p>
      <Link to={to} onClick={onNavigate} className="flex h-12 items-center gap-2 rounded-[10px] bg-primary px-7 text-body font-bold text-white">
        {cta}
        <ArrowRight size={16} />
      </Link>
    </div>
  )
}
