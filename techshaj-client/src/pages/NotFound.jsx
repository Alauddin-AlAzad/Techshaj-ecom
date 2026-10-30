import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="site-container flex flex-col items-center gap-4 py-20 text-center">
      <h1 className="text-h1">404</h1>
      <p className="text-body-lg text-text-muted">Page not found</p>
      <Link to="/" className="text-label text-primary">
        Back to home
      </Link>
    </div>
  )
}
