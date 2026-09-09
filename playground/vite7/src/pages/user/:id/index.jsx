import { useParams } from 'react-router-dom'

export function Component() {
  const { id } = useParams()

  return <div className="dynamic-directory">{id}</div>
}

if (import.meta.env.DEV) {
  Component.displayName = 'DynamicDirectory'
}
