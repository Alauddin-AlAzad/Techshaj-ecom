import { useParams } from 'react-router-dom'

export default function Category() {
  const { slug } = useParams()
  return <h1 className="text-h2">Category: {slug}</h1>
}
