import { useState } from 'react'
import { BrowserRouter, useRoutes } from 'react-router-dom'
import routes from 'route-views'

function Routes() {
  return useRoutes(routes)
}

function App() {
  return (
    <BrowserRouter>
      <Routes />
    </BrowserRouter>
  )
}

export default App
