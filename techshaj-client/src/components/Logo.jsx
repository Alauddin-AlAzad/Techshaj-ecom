import logoMark from '../assets/logo-mark.png'
import { useBranding } from '../hooks/useSettings.js'
import { DEFAULT_STORE_NAME } from '../lib/branding.js'
import { cn } from '../lib/cn.js'

// xl = the 200% instance on the About page, lg = the 120% instance on the admin login, sm = the 85% instance used in the mobile header and footer, xs = the 75% instance in the menu drawer
// height is reserved on the wrapper so a saved logo loading in does not move the layout.
const sizes = {
  xl: { wrap: 'h-20 gap-5', mark: 'size-20 rounded-[18px]', text: 'text-[44px] tracking-[-0.88px]', image: 'h-20 max-w-[360px]' },
  lg: { wrap: 'h-12 gap-3', mark: 'size-12 rounded-[10.8px]', text: 'text-[26.4px] tracking-[-0.528px]', image: 'h-12 max-w-[260px]' },
  md: { wrap: 'h-10 gap-2.5', mark: 'size-10 rounded-[9px]', text: 'text-[22px] tracking-[-0.44px]', image: 'h-10 max-w-[220px]' },
  sm: { wrap: 'h-[34px] gap-[8.5px]', mark: 'size-[34px] rounded-[7.65px]', text: 'text-[18.7px] tracking-[-0.374px]', image: 'h-[34px] max-w-[170px]' },
  xs: { wrap: 'h-[30px] gap-[7.5px]', mark: 'size-[30px] rounded-[6.75px]', text: 'text-[16.5px] tracking-[-0.33px]', image: 'h-[30px] max-w-[150px]' },
}

// Reads the saved logo and store name; brand overrides them (the settings preview), onLight darkens the wordmark.
export default function Logo({ size = 'md', className, brand, onLight = false }) {
  const saved = useBranding()
  const { name, logoUrl } = brand ?? saved
  const s = sizes[size]

  if (logoUrl) {
    return (
      <span className={cn('flex items-center', s.wrap, className)}>
        <img src={logoUrl} alt={name} className={cn('w-auto object-contain object-left', s.image)} />
      </span>
    )
  }
  return (
    <span className={cn('flex items-center', s.wrap, className)}>
      <img src={logoMark} alt="" className={cn('object-cover', s.mark)} />
      <span className={cn('font-body font-extrabold whitespace-nowrap', onLight ? 'text-text' : 'text-white', s.text)}>
        {name === DEFAULT_STORE_NAME ? (
          <>
            Tech<span className="text-primary">Shaj</span>
          </>
        ) : (
          name
        )}
      </span>
    </span>
  )
}
