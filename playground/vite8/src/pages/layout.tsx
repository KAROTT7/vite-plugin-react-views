import { Outlet, Link, useRouteLoaderData } from 'react-router-dom'

export const id = '/'

export function loader() {
  return {
    root: 'root'
  }
}

export function handle() {}

export function action() {}

export function ErrorBoundary() {
  return (
    <div className="route-error">Route Error</div>
  )
}

export function shouldRevalidate() {
  return false
}

export function Component() {
  const data = useRouteLoaderData('/') as { root: string }

  return (
    <>
      <div>
        <Link className="index" to="/">index</Link>{' '}
        <Link className="contact" to="/contact">/contact</Link>{' '}
        <Link className="about" to="/about">/about</Link>{' '}
        <Link className="utils" to="/utils">/utils</Link>{' '}
        <Link className="foo" to="/foo">/foo</Link>{' '}
        <Link className="foo-bar" to="/foo/bar">/foo/bar</Link>{' '}
        <Link className="foo-type" to="/foo/a">/foo/:type</Link>{' '}
        <Link className="bar-dynamic" to="/bar/dynamic">/bar/:dynamic</Link>{' '}
        <Link className="hyphen-name" to="/hyphen-name">/hyphen-name</Link>{' '}
        <Link className="excluded-components" to="/components">/excluded/components</Link>
        <Link className="error" to="/error">/error</Link>
      </div>
      <div className="layout">layout</div>
      <div className="layout-loader-data">{data.root}</div>
      <Outlet />
    </>
  )
}

if (import.meta.env.DEV) {
  Component.displayName = 'Layout'
}
