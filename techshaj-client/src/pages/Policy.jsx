import { useParams } from 'react-router-dom'

export default function Policy() {
  const { type } = useParams()
  return <h1 className="text-h2">Policy: {type}</h1>
}
