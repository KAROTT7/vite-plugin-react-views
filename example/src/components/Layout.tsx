import { Outlet, NavLink } from 'react-router-dom'

export default function Layout() {
  const addStyle = ({ isActive }: { isActive: boolean }) => ({
    color: isActive ? 'red' : '#232323'
  })

  return (
    <div
      style={{
        padding: 30
      }}
    >
      <div style={{ marginBottom: 15 }}>Welcome to vite-plugin-react-router</div>
      <div
        style={{ marginBottom: 15 }}
      >
        <NavLink style={addStyle} to="/">home</NavLink>{' '}
        <NavLink style={addStyle} to="/about">about</NavLink>{' '}
        <NavLink style={addStyle} to="/product">product</NavLink>{' '}
        <NavLink style={addStyle} to="/faq">faq</NavLink>{' '}
      </div>

      <Outlet />
    </div>
  )
}
