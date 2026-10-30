import { useParams } from 'react-router-dom'

export default function Policy() {
  const { type } = useParams()
  return <h1 className="site-container py-8 text-h2">Policy: {type}</h1>
}
