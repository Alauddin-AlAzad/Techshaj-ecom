import { notify } from './notify.jsx'

export async function copyText(text, message = 'Copied') {
  try {
    await navigator.clipboard.writeText(text)
    notify.success(message, { description: text })
  } catch {
    notify.error('Could not copy', { description: 'Please copy it manually' })
  }
}
