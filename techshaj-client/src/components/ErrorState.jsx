import { useQueryClient } from '@tanstack/react-query'
import { RotateCw, WifiOff } from 'lucide-react'

// Shown when a request fails. Retry refetches the page's queries plus any other failed ones on screen (header, footer).
export default function ErrorState({ title = 'Could not load this page', text = 'Check your connection and try again.', onRetry }) {
  const queryClient = useQueryClient()
  const retry = () => {
    onRetry?.()
    queryClient.refetchQueries({ type: 'active', predicate: (q) => q.state.status === 'error' })
  }

  return (
    <div role="alert" className="flex flex-col items-center gap-3.5 px-6 py-16 text-center">
      <span className="flex size-24 items-center justify-center rounded-full bg-primary-tint text-primary">
        <WifiOff size={42} strokeWidth={1.75} />
      </span>
      <h2 className="text-[20px] font-bold tracking-[-0.3px] text-text">{title}</h2>
      <p className="max-w-[342px] text-body text-text-muted">{text}</p>
      <button type="button" onClick={retry} className="flex h-12 items-center gap-2 rounded-[10px] bg-primary px-7 text-body font-bold text-white">
        <RotateCw size={16} />
        Retry
      </button>
    </div>
  )
}
