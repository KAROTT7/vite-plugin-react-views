export function Component() {
  return <div className="foo-content">bar</div>
}

if (import.meta.env.DEV) {
  Component.displayName = 'Bar'
}
