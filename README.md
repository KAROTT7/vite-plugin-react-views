# vite-plugin-react-views
基于 `react`，`react-router-dom@6` 自动创建路由。

### 用法
- 安装
  ```js
  npm install vite-plugin-react-views -D
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
      // - 执行 router() 后会自动将 src/pages 下的文件（/\.(jsx?|tsx?)$/）创建成路由
      // - options 参数是可选的
      // 其他约定
      // - src/pages/layout 文件将会配置成根布局；其他文件夹下的布局文件将会配置成文件夹布局（比如 /about/layout 是一个布局
      // - src/pages/404 文件将会配置成 404 路由
      router(options)
    ]
  })

  // src/App.js
  import { BrowserRouter } from 'react-router-dom'
  // 请引入 route-views
  import Routes from 'route-views'

  function App(props) {
    return (
      <BrowserRouter>
        // props 将会传给路由
        <Routes {...props} />
      </BrowserRouter>
    )
  }

  export default App
  ```

### options（参数都是可选的
  - dir: string
    
    默认值：src/pages
  
  - loading: string

    loading 页面路径（比如：src/components/loading); 除 src/pages/layout 和 src/pages/404 以外，其他路由全部异步加载
    ```js
    const Component = lazy(file)

    <Suspense fallback={<Loading /> || null}>
      <Component />
    </Suspense>
    ```

  - exclude: (path) => boolean

    如果返回 `true`，则不会配置成路由

### License
MIT
  
