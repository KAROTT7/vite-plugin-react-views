# vite-plugin-react-views
基于文件结构使用 `react-router-dom@^6` 自动创建路由。

### 用法
- 安装
  ```js
  npm install vite-plugin-react-views --save-dev
  ```
- 使用
  ```js
  // vite.config.js
  import { defineConfig } from 'vite'
  import react from '@vitejs/plugin-react'
  import router from 'vite-plugin-react-views'

  export default defineConfig({
    plugins: [
      react(),
      // 执行 router() 后会自动将 src/pages
      // 下的文件(js,jsx,ts,tsx)创建成路由
      router()
    ]
  })

  // src/App.jsx
  import { BrowserRouter, useRoutes } from 'react-router-dom'
  // 请引入 route-views
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
  ```

### options
  - dir: string
    
    默认值：src/pages

  - exclude: (path) => boolean

    如果返回 `true`，则不会配置成路由

### 路由
按照约定，src/pages 下的所有文件都会配置成路由，并使用 `React.lazy` 懒加载
- `/a/index.js` 会配置成默认路由 -> `/a`
- `/a/_type.js` 会配置成动态路由 -> `/a/:type`
- 其他则会配置成静态路由

### Layout
- src/pages/layout 将作为根布局，同步加载

- 其他文件夹下的布局将会是异步加载；按照约定，`src/pages/a/layout` 将会是路由 /a 的布局组件

### Loading
src/pages/loading 文件将会作为全局 Loading 组件（将会在加载路由时展示），且是同步加载。

### 404
src/pages/404 文件将会配置成 404 路由。

### BaseUrl
使用 '/' 作为基础路径。

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
  
