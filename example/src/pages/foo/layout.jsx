import { Outlet } from 'react-router-dom'

const el = document.createElement('div')
el.id = 'foo_layout'
document.body.appendChild(el)

export function Component() {
  return (
    <>
      <div className="foo-layout">layout-foo</div>
      <Outlet />
    </>
  )
}

if (import.meta.env.DEV) {
  Component.displayName = 'FooLayout'
}
