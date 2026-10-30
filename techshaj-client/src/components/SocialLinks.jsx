import { MessageCircle } from 'lucide-react'
import { LuFacebook, LuInstagram } from 'react-icons/lu'
import { cn } from '../lib/cn.js'

const sizes = {
  md: { box: 'size-9', icon: 18 },
  sm: { box: 'size-[34px]', icon: 17 },
  xs: { box: 'size-8', icon: 15 },
}

export default function SocialLinks({ social, size = 'md', className }) {
  const items = [
    { href: social?.facebook, label: 'Facebook', Icon: LuFacebook, bg: 'bg-facebook' },
    { href: social?.instagram, label: 'Instagram', Icon: LuInstagram, bg: 'bg-instagram' },
    { href: social?.whatsapp, label: 'WhatsApp', Icon: MessageCircle, bg: 'bg-whatsapp' },
  ]
  const { box, icon } = sizes[size]

  return (
    <div className={cn('flex gap-2.5', className)}>
      {items.map(({ href, label, Icon, bg }) => (
        <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label} className={cn('flex items-center justify-center rounded-full text-white', box, bg)}>
          <Icon size={icon} />
        </a>
      ))}
    </div>
  )
}
