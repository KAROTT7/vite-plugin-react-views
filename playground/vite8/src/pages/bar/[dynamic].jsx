import { useParams } from 'react-router-dom'

export function Component() {
  const { dynamic } = useParams()

  return <div className="dynamic">{dynamic}</div>
}

if (import.meta.env.DEV) {
  Component.displayName = 'Dynamic'
}
