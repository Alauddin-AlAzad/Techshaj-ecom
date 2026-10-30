import { Inbox } from 'lucide-react'
import Button from './Button.jsx'

// action: { label, Icon, to } or { label, Icon, onClick }
export default function EmptyState({ Icon = Inbox, title = 'Nothing here yet', text, action }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-primary-tint text-primary">
        <Icon size={28} strokeWidth={1.75} />
      </span>
      <h2 className="text-h4 text-text">{title}</h2>
      {text && <p className="max-w-[360px] text-body text-text-muted">{text}</p>}
      {action && (
        <Button Icon={action.Icon} to={action.to} onClick={action.onClick} className="mt-1">
          {action.label}
        </Button>
      )}
    </div>
  )
}
