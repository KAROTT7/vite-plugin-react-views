# vite-plugin-react-views
A vite plugin based on File System for creating routes automatically.

Some rules you need to know:
- Requirement: `react-router-dom@^6`
- All files in conventional directory will become routes, except empty files and excluded files.
- For code splitting, all routes will be imported dynamically by `React.lazy`, except layout/loading route in root directory.
- A file starts with a `_` character will be `dynamic route`.
- Every file named `layout` in directory will become layout route.
- A `404` file in root directory will become `404 route`.
- A `loading` file in root directory will show before other routes finish import.

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
import { useRoutes } from 'react-router-dom'
// Requirement: import routes
import routes from 'route-views'

function Routes() {
  return useRoutes(routes)
}

// Other codes
```

### Options

- dir: string

  default: `'src/pages'`

  A directory path for crawling.

- exclude(path): boolean

  A file will not become a route if return true.

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
