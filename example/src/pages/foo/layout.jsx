import { Outlet } from 'react-router-dom'

export default function FooLayout() {
  return (
    <>
      <div className="foo-layout">layout-foo</div>
      <Outlet />
    </>
  )
}
