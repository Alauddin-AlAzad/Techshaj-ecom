import { Truck } from 'lucide-react'

function Messages({ messages }) {
  return (
    <div className="flex shrink-0 items-center gap-1.5 pr-6 lg:gap-2">
      <Truck className="size-[13px] shrink-0 lg:size-[15px]" />
      {messages.map((message, i) => (
        <span key={i} className="flex items-center gap-6 whitespace-nowrap">
          {i > 0 && <span aria-hidden="true">•</span>}
          {message}
        </span>
      ))}
    </div>
  )
}

export default function AnnouncementBar({ messages = [] }) {
  if (!messages.length) return <div className="h-[30px] bg-primary lg:h-[34px]" />

  // Two identical halves; the track slides by -50% so the loop is seamless.
  const half = Array.from({ length: 4 }, (_, i) => <Messages key={i} messages={messages} />)

  return (
    <div className="h-[30px] overflow-hidden bg-primary text-[12px] font-semibold text-white lg:h-[34px] lg:text-[13px]">
      <p className="sr-only">{messages.join('. ')}</p>
      <div className="flex h-full w-max animate-marquee items-center motion-reduce:animate-none" aria-hidden="true">
        {half}
        {half.map((el, i) => (
          <Messages key={`b${i}`} messages={messages} />
        ))}
      </div>
    </div>
  )
}
