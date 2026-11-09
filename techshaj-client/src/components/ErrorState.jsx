import { useQueryClient } from '@tanstack/react-query'
import { ExternalLink, RotateCw, WifiOff } from 'lucide-react'

const inAppBrowser = typeof navigator !== 'undefined' && /FBAN|FBAV|FB_IAB|Instagram|Messenger/i.test(navigator.userAgent)

// Shown when a request fails. Retry refetches the page's queries plus any other failed ones on screen (header, footer).
export default function ErrorState({ title = 'Could not load this page', text = 'Check your connection and try again.', onRetry }) {
  const queryClient = useQueryClient()
  const retry = () => {
    onRetry?.()
    queryClient.refetchQueries({ type: 'active', predicate: (q) => q.state.status === 'error' })
  }
  const failed = queryClient.getQueryCache().findAll({ predicate: (q) => q.state.status === 'error' })[0]?.state.error
  const detail = failed && [failed.code, failed.response?.status, failed.message].filter(Boolean).join(' · ')

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
      {inAppBrowser && (
        <p className="flex max-w-[342px] items-start gap-1.5 rounded-lg bg-fill px-3 py-2.5 text-left text-body-sm text-text-secondary">
          <ExternalLink size={15} className="mt-0.5 shrink-0" />
          Opened from Messenger or Facebook? Tap ⋯ at the top and choose “Open in browser”.
        </p>
      )}
      {detail && <p className="text-[11px] text-text-faint">{detail}</p>}
    </div>
  )
}
