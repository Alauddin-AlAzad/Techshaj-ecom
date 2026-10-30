import Button from './Button.jsx'

// action: { label, Icon, to } or { label, Icon, onClick }
export default function PageHeader({ title, subtitle, action, children }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 flex-col gap-0.5">
        <h1 className="text-[20px] font-bold text-text">{title}</h1>
        {subtitle && <p className="text-[13px] text-text-muted">{subtitle}</p>}
      </div>
      {(action || children) && (
        <div className="flex flex-wrap items-center gap-2.5">
          {children}
          {action && (
            <Button Icon={action.Icon} to={action.to} onClick={action.onClick}>
              {action.label}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
