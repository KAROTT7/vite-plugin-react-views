import { Outlet } from 'react-router-dom'

const el = document.createElement('div')
el.id = 'foo_layout'
document.body.appendChild(el)

export default function FooLayout() {
  return (
    <>
      <div className="foo-layout">layout-foo</div>
      <Outlet />
    </>
  )
}
