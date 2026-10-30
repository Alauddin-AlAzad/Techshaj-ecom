import { toast } from 'sonner'
import Toast from '../components/Toast.jsx'

// notify.success('Added to cart', { description, action: { label, onClick } }); options pass through to sonner.
function show(variant, title, { description, action, ...options } = {}) {
  return toast.custom(
    (id) => (
      <Toast
        variant={variant}
        title={title}
        description={description}
        action={action}
        onAction={() => {
          action.onClick()
          toast.dismiss(id)
        }}
      />
    ),
    { duration: 3000, ...options },
  )
}

export const notify = {
  success: (title, options) => show('success', title, options),
  wish: (title, options) => show('wish', title, options),
  info: (title, options) => show('info', title, options),
  error: (title, options) => show('error', title, options),
  dismiss: (id) => toast.dismiss(id),
}
