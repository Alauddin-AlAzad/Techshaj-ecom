import { LoaderCircle } from 'lucide-react'
import { cn } from '../../lib/cn.js'

export default function Spinner({ size = 20, className }) {
  return <LoaderCircle size={size} aria-hidden="true" className={cn('shrink-0 animate-spin', className)} />
}

export function FullPageSpinner() {
  return (
    <div role="status" aria-label="Loading" className="flex min-h-screen items-center justify-center bg-surface text-primary">
      <Spinner size={36} />
    </div>
  )
}
