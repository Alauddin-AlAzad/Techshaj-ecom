import logoMark from '../assets/logo-mark.png'

export default function Logo({ className = '' }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <img src={logoMark} alt="" className="size-10 rounded-[9px] object-cover" />
      <span className="font-body text-[22px] font-extrabold tracking-[-0.44px] whitespace-nowrap text-white">
        Tech<span className="text-primary">Shaj</span>
      </span>
    </div>
  )
}
