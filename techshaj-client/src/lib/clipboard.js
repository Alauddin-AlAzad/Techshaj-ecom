import { toast } from 'sonner'

export async function copyText(text, message = 'Copied') {
  try {
    await navigator.clipboard.writeText(text)
    toast.success(message, { description: text })
  } catch {
    toast.error('Could not copy. Please copy it manually.')
  }
}
