import { useEffect, useState } from 'react'

const pad = (n) => String(n).padStart(2, '0')

export function useCountdown(endsAt) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const left = Math.max(0, new Date(endsAt).getTime() - now) / 1000
  return {
    days: pad(Math.floor(left / 86400)),
    hours: pad(Math.floor((left % 86400) / 3600)),
    mins: pad(Math.floor((left % 3600) / 60)),
    secs: pad(Math.floor(left % 60)),
    ended: left === 0,
  }
}
