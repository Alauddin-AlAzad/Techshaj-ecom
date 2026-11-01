import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function ProductBackBar() {
  const navigate = useNavigate()
  const back = () => (window.history.state?.idx > 0 ? navigate(-1) : navigate('/'))

  return (
    <div className="sticky top-0 z-50 border-b border-border bg-white">
      <div className="site-container flex h-14 items-center">
        <button type="button" onClick={back} aria-label="Go back" className="-ml-2 flex h-10 items-center gap-2 rounded-full px-2 text-label font-semibold text-text hover:text-primary">
          <ArrowLeft size={22} />
          Back
        </button>
      </div>
    </div>
  )
}
