import { Copy, X } from 'lucide-react'
import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { FaFacebook, FaFacebookMessenger, FaInstagram, FaTelegram, FaWhatsapp } from 'react-icons/fa'
import { formatPrice } from '../../lib/format.js'
import { notify } from '../../lib/notify.jsx'

const enc = encodeURIComponent

export default function ShareSheet({ product, onClose }) {
  const url = window.location.href
  const text = `${product.name} - ${formatPrice(product.price)}`

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = overflow
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      notify.success('Link copied')
    } catch {
      notify.error('Could not copy the link')
    }
  }
  // Instagram has no web share link, so the link is copied and the app is opened.
  const instagram = async () => {
    await copy()
    window.open('https://www.instagram.com/', '_blank', 'noopener')
  }
  const open = (href) => window.open(href, '_blank', 'noopener')
  const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent)

  const targets = [
    { label: 'Copy', Icon: Copy, tone: 'bg-fill text-text', onClick: copy },
    { label: 'WhatsApp', Icon: FaWhatsapp, tone: 'bg-whatsapp text-white', onClick: () => open(`https://wa.me/?text=${enc(`${text} ${url}`)}`) },
    { label: 'Facebook', Icon: FaFacebook, tone: 'bg-facebook text-white', onClick: () => open(`https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`) },
    {
      label: 'Messenger',
      Icon: FaFacebookMessenger,
      tone: 'bg-facebook text-white',
      onClick: () => (isMobile ? (window.location.href = `fb-messenger://share/?link=${enc(url)}`) : open(`https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`)),
    },
    { label: 'Instagram', Icon: FaInstagram, tone: 'bg-instagram text-white', onClick: instagram },
    { label: 'Telegram', Icon: FaTelegram, tone: 'bg-telegram text-white', onClick: () => open(`https://t.me/share/url?url=${enc(url)}&text=${enc(text)}`) },
  ]

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center p-3 sm:items-center">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 size-full bg-dark/55" />
      <div role="dialog" aria-modal="true" aria-label="Share this product" className="relative flex w-full max-w-[380px] flex-col gap-3">
        <div className="rounded-2xl bg-white p-4">
          <img src={product.images?.[0]} alt="" className="h-[150px] w-full rounded-lg bg-fill object-contain mix-blend-multiply" />
          <p className="mt-3 line-clamp-2 text-body text-text">{product.name}</p>
          <p className="mt-2 text-price-lg text-primary">{formatPrice(product.price)}</p>
        </div>
        <div className="rounded-2xl bg-white p-4">
          <div className="flex items-center justify-between">
            <p className="text-label font-semibold text-text">Share this product with Friends!</p>
            <button type="button" onClick={onClose} aria-label="Close" className="flex size-9 items-center justify-center rounded-full bg-fill text-text">
              <X size={18} />
            </button>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-y-4">
            {targets.map(({ label, Icon, tone, onClick }) => (
              <button key={label} type="button" onClick={onClick} className="flex flex-col items-center gap-1.5 text-label-sm text-text">
                <span className={`flex size-10 items-center justify-center rounded-xl ${tone}`}>
                  <Icon size={22} />
                </span>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
