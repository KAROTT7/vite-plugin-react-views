import { useParams } from 'react-router-dom'

export default function Type() {
  const { type } = useParams()

  return <div className="foo-content">{type}</div>
}
