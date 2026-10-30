import { useState } from 'react'
import { cn } from '../../lib/cn.js'
import BannerLink from '../BannerLink.jsx'

const bannerAlt = (banner) => banner.title?.replace(/\s*\n\s*/g, ' ').trim() || 'Promotional banner'

// One clickable banner image (zoom adds a slow zoom on hover); the box keeps its ratio and shimmers until the image arrives.
export default function BannerImage({ banner, eager = false, zoom = false, className, imgClassName, onClick }) {
  const [loaded, setLoaded] = useState(false)
  return (
    <BannerLink link={banner.link} onClick={onClick} className={cn('group/banner relative block overflow-hidden', !loaded && 'skeleton', className)}>
      <img
        src={banner.image}
        alt={bannerAlt(banner)}
        loading={eager ? 'eager' : 'lazy'}
        fetchPriority={eager ? 'high' : undefined}
        decoding="async"
        draggable={false}
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
        className={cn('size-full object-cover', zoom && 'transition-transform duration-500 ease-out group-hover/banner:scale-105', imgClassName)}
      />
    </BannerLink>
  )
}
