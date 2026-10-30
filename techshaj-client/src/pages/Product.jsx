import { useParams } from 'react-router-dom'

export default function Product() {
  const { slug } = useParams()
  return <h1 className="text-h2">Product: {slug}</h1>
}
