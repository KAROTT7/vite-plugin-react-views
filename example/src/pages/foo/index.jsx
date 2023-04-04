export function Component() {
  return <div className="foo-content">foo</div>
}

if (import.meta.env.DEV) {
  Component.displayName = 'Foo'
}
