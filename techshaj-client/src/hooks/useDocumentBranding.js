import { useEffect } from 'react'
import { setSiteName } from '../lib/documentTitle.js'
import { useBranding } from './useSettings.js'

// Puts the store name in every tab title and swaps the favicon for the saved one.
export function useDocumentBranding() {
  const { name, faviconUrl } = useBranding()

  useEffect(() => {
    setSiteName(name)
  }, [name])

  useEffect(() => {
    const link = document.querySelector('link[rel~="icon"]')
    if (!link) return
    link.dataset.defaultHref ??= link.getAttribute('href')
    link.dataset.defaultType ??= link.getAttribute('type') ?? ''
    if (faviconUrl) {
      link.setAttribute('href', faviconUrl)
      link.removeAttribute('type')
    } else {
      link.setAttribute('href', link.dataset.defaultHref)
      if (link.dataset.defaultType) link.setAttribute('type', link.dataset.defaultType)
    }
  }, [faviconUrl])
}
