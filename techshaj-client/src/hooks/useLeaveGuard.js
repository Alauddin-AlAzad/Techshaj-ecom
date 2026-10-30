import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

// Asks before leaving a page with unsaved changes: tab close/reload, in-app links and request(to).
// BrowserRouter has no useBlocker, so in-app links are caught with a click listener.
export function useLeaveGuard(when) {
  const navigate = useNavigate()
  const [pending, setPending] = useState(null)
  const active = useRef(when)
  useEffect(() => {
    active.current = when
  }, [when])

  useEffect(() => {
    if (!when) return
    const onBeforeUnload = (e) => {
      e.preventDefault()
      e.returnValue = ''
    }
    const onClick = (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const a = e.target.closest?.('a[href]')
      if (!a || a.target === '_blank' || a.hasAttribute('download')) return
      const url = new URL(a.href, window.location.href)
      if (url.origin !== window.location.origin) return
      const to = url.pathname + url.search + url.hash
      if (to === window.location.pathname + window.location.search + window.location.hash) return
      e.preventDefault()
      e.stopPropagation()
      setPending(to)
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    document.addEventListener('click', onClick, true)
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload)
      document.removeEventListener('click', onClick, true)
    }
  }, [when])

  // Navigate now if nothing is unsaved, otherwise ask first.
  const request = useCallback((to) => (active.current ? setPending(to) : navigate(to)), [navigate])
  // Leave without asking, e.g. right after a successful save.
  const leave = useCallback(
    (to, options) => {
      active.current = false
      setPending(null)
      navigate(to, options)
    },
    [navigate],
  )

  return {
    pending,
    request,
    leave,
    confirm: () => leave(pending),
    cancel: () => setPending(null),
  }
}
