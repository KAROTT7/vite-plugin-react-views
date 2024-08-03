# vite-plugin-react-views
A vite plugin based on File System for creating routes automatically.

Some rules you need to know:
- Requirement: `react-router-dom@^6.9`
- All files in conventional directory will become routes, except empty files and excluded files.
- For code splitting, all routes will be imported dynamically by [lazy](https://reactrouter.com/en/dev/route/lazy), except layout route in root directory.
- you can export `'Component'、'ErrorBoundary'、'loader'、'action', 'handle'、'shouldRevalidate'、'errorElement'、'id'` in every route file
- A file starts with a `_` character or wraps by `[]` will be `dynamic route`.
- Every file named `layout` in directory will become layout route.

### Installation
```js
npm install vite-plugin-react-views --save-dev
```

### Usage
```js
// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import router from 'vite-plugin-react-views'

export default defineConfig({
  plugins: [react(), router()]
})

// App.jsx
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
// Requirement: import routes
import routes from 'route-views'

const router = createBrowserRouter(routes)

export default function App() {
  return (
    <RouterProvider
      router={router}
    />
  )
}
```

### Options

- dir: string

  default: `'src/pages'`

  A directory path for crawling.

- exclude(path): boolean

  A file will not become a route if return true.

- sync(path): boolean

  A route will be imported synchronously if return true.

- extensions: string[]

  default: `['js', 'jsx', 'ts', 'tsx']`

  Filename extensions which will be scanned and imported as route elements.

### Typescript
```js
// src/vite-env.d.ts
/// <reference types="vite/client" />

declare module 'route-views' {
  const routes: (import('react-router-dom').RouteObject)[];

  export default routes;
}
```

### License
MIT
