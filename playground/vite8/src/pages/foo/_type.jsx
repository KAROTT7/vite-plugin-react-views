import { useParams } from 'react-router-dom'

export function Component() {
  const { type } = useParams()

  return <div className="foo-content">{type}</div>
}

if (import.meta.env.DEV) {
  Component.displayName = 'Type'
}
