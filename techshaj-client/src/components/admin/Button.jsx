import { Link } from 'react-router-dom'
import { cn } from '../../lib/cn.js'
import Spinner from './Spinner.jsx'

// Figma "Add product" / "Last 7 days" buttons (54:7835, 54:7828).
const variants = {
  primary: 'bg-primary text-white hover:bg-primary-deep',
  secondary: 'border border-border-strong bg-white text-text hover:border-text-faint',
  danger: 'bg-error text-white hover:opacity-90',
  ghost: 'text-text-secondary hover:bg-fill',
}

export default function Button({ variant = 'primary', Icon, loading = false, to, className, children, disabled, ...props }) {
  const classes = cn(
    'inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg px-4 text-[13px] font-semibold whitespace-nowrap transition-colors disabled:pointer-events-none disabled:opacity-50',
    variants[variant],
    className,
  )
  const content = (
    <>
      {loading ? <Spinner size={16} /> : Icon && <Icon size={16} />}
      {children}
    </>
  )
  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {content}
      </Link>
    )
  }
  return (
    <button type="button" disabled={disabled || loading} className={classes} {...props}>
      {content}
    </button>
  )
}
