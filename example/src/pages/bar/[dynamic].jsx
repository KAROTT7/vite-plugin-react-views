import { useParams } from 'react-router-dom'

export default function Dynamic() {
  const { dynamic } = useParams()

  return <div className="dynamic">{dynamic}</div>
}
