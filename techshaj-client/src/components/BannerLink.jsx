import { Link } from 'react-router-dom'
import { isExternalLink } from '../lib/bannerLink.js'

// Wraps a banner image: router link for "/" paths, new tab for full links, plain block without a link.
export default function BannerLink({ link, label, className, children, ...props }) {
  if (link?.startsWith('/')) {
    return (
      <Link to={link} aria-label={label} className={className} {...props}>
        {children}
      </Link>
    )
  }
  if (isExternalLink(link)) {
    return (
      <a href={link} target="_blank" rel="noopener noreferrer" aria-label={label} className={className} {...props}>
        {children}
      </a>
    )
  }
  return <div className={className}>{children}</div>
}
