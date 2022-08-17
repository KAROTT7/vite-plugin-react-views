import fg from 'fast-glob'
import type { PluginOption } from 'vite'

interface Options {
  dir?: string;
  exclude?(path: string): boolean;
}

interface RouteObject {
  paths: string[];
  value: string;
}

interface ReactRoute {
  element: string;
  index?: boolean;
  path?: string;
  children?: ReactRoute[]
}

function VitePluginReactRouter(opts: Options = {}): PluginOption {
  const {
    dir = 'src/pages',
    exclude = () => false
  } = opts

  const prefix = '\0'
  const EXTS = ['js', 'jsx', 'ts', 'tsx']
  const MODULE_NAME = 'route-views'
  const VIRTUAL_MODULE = prefix + MODULE_NAME + `.${EXTS[1]}`

  function createPages() {
    const files = fg.sync(`${dir}/**/*.{${EXTS.join(',')}}`)

    let layouts = {}, routes: RouteObject[] = []
    let layout: string | undefined, noMatch: string | undefined, loading: string | undefined
    files.forEach(fileName => {
      if (exclude(fileName)) {
        return
      }

      const key = fileName.replace(dir + '/', '').replace(/(\..+)$/, (_, $1) => _.replace($1, ''))
      if ('layout' === key) {
        layout = '/' + fileName
      } else if ('loading' === key) {
        loading = '/' + fileName
      } else if ('404' === key) {
        noMatch = '/' + fileName
      } else {
        const value = `Lazilize(() => import('/${fileName}'))`
        const path = key.replace(`${dir}/`, '').replace(new RegExp(`\\.(${EXTS.join('|')})`), '')
        const route: RouteObject = { paths: path.split('/'), value }

        if (path.endsWith('layout')) {
          layouts[path.replace(new RegExp('\/?layout'), '')] = route
        } else {
          routes.push(route)
        }
      }
    })

    let o: ReactRoute[] = [], map = {};
    routes.forEach((route) => {
      const { paths } = route
      let prevRoutes = o
      for (let i = 0; i < paths.length; ++i) {
        const end = paths[i + 1] === undefined
        const path = paths[i]

        if (end) {
          const r: ReactRoute = { element: route.value }
          if (path === 'index') {
            r.index = true
          } else {
            r.path = path
          }

          prevRoutes.push(r)
        } else {
          const currentPath = paths.slice(0, i + 1).join('/')
          const existed = map[currentPath]

          if (existed) {
            prevRoutes = existed.children
          } else {
            const layout = layouts[currentPath]
            const route = {
              path,
              element: layout ? layout.value : undefined,
              children: []
            }

            prevRoutes.push(map[currentPath] = route)
            prevRoutes = route.children
          }
        }
      }
    })

    return {
      pages: JSON.stringify(o)
                .replace(/"(Lazilize[^,]+)/g, (_, $1) => $1.slice(0, -1)),
      layout,
      noMatch,
      loading
    }
  }

  return {
    name: 'vite-plugin-react-views',
    configureServer(server) {
      function handleFileChange(path: string) {
        if (path.includes(dir) && !exclude(path)) {
          const mod = server.moduleGraph.getModuleById(VIRTUAL_MODULE)
          if (mod) {
            server.moduleGraph.invalidateModule(mod)
          }

          server.ws.send({
            type: 'full-reload',
            path: '*'
          })
        }
      }

      server.watcher.on('add', handleFileChange)
      server.watcher.on('unlink', handleFileChange)
    },
    resolveId(id: string) {
      if (id === MODULE_NAME) {
        return VIRTUAL_MODULE
      }
    },
    load(id) {
      if (id === VIRTUAL_MODULE) {
        const { loading, layout, noMatch, pages } = createPages()

        return `import { lazy, Suspense } from 'react'
${loading ? `import Loading from '${loading}'` : ''}
${layout ? `import Layout from '${layout}'` : ''}
${noMatch ? `import NoMatch from '${noMatch}'` : ''}

function Lazilize(importFn) {
  const Component = lazy(importFn)
  return (
    <Suspense
      fallback={${loading ? '<Loading />' : 'undefined'}}
    >
      <Component />
    </Suspense>
  )
}

export default [
  {
    path: '/',
    element: ${layout ? '<Layout />' : 'undefined'},
    children: ${pages}
  },
  ${noMatch ? '{ path: "*", element: <NoMatch /> }' : '{}'}
]`
      }
    },
  }
}

export default VitePluginReactRouter
