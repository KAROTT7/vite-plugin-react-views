export function Component() {
  return <div className="content">index</div>
}

if (import.meta.env.DEV) {
  Component.displayName = 'Home'
}
