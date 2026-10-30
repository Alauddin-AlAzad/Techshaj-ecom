import logoMark from '../assets/logo-mark.png'
import { cn } from '../lib/cn.js'

// sm = the 85% instance used in the mobile header and footer
const sizes = {
  md: { wrap: 'gap-2.5', mark: 'size-10 rounded-[9px]', text: 'text-[22px] tracking-[-0.44px]' },
  sm: { wrap: 'gap-[8.5px]', mark: 'size-[34px] rounded-[7.65px]', text: 'text-[18.7px] tracking-[-0.374px]' },
}

export default function Logo({ size = 'md', className }) {
  const s = sizes[size]
  return (
    <span className={cn('flex items-center', s.wrap, className)}>
      <img src={logoMark} alt="" className={cn('object-cover', s.mark)} />
      <span className={cn('font-body font-extrabold whitespace-nowrap text-white', s.text)}>
        Tech<span className="text-primary">Shaj</span>
      </span>
    </span>
  )
}
