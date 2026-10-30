import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cn } from '../lib/cn.js'

// Mobile top bar with a back arrow, used where the Figma mobile frame drops the site header.
export default function PageTopBar({ children, back: showBack = true, className }) {
  const navigate = useNavigate()
  const back = () => (window.history.state?.idx > 0 ? navigate(-1) : navigate('/'))

  return (
    <div className={cn('flex h-14 items-center gap-3 border-b border-border bg-white px-4 lg:hidden', className)}>
      {showBack && (
        <button type="button" onClick={back} aria-label="Go back" className="text-text">
          <ArrowLeft size={22} />
        </button>
      )}
      {children}
    </div>
  )
}
