import { Outlet, Link } from 'react-router-dom'

export default function Layout() {
  return (
    <>
      <div>
        <Link className="index" to="/">index</Link>{' '}
        <Link className="contact" to="/contact">/contact</Link>{' '}
        <Link className="about" to="/about">/about</Link>{' '}
        <Link className="utils" to="/utils">/utils</Link>{' '}
        <Link className="foo" to="/foo">/foo</Link>{' '}
        <Link className="foo-bar" to="/foo/bar">/foo/bar</Link>{' '}
        <Link className="foo-type" to="/foo/a">/foo/:type</Link>
      </div>
      <div className="layout">layout</div>
      <Outlet />
    </>
  )
}
