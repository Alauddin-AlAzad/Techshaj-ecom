import { RotateCw, TriangleAlert } from 'lucide-react'
import Button from './Button.jsx'

export default function ErrorState({ title = 'Could not load data', text = 'Check your connection and try again.', onRetry }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-error-tint text-error">
        <TriangleAlert size={28} strokeWidth={1.75} />
      </span>
      <h2 className="text-h4 text-text">{title}</h2>
      <p className="max-w-[360px] text-body text-text-muted">{text}</p>
      {onRetry && (
        <Button variant="secondary" Icon={RotateCw} onClick={onRetry} className="mt-1">
          Retry
        </Button>
      )}
    </div>
  )
}
