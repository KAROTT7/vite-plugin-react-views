import fs from 'node:fs'
import path from 'node:path'
import type { PluginOption, ResolvedConfig } from 'vite'
import type { RouteObject } from 'react-router-dom'

interface Options {
  dir?: string;
  exclude?(path: string): boolean;
}

function slash(id: string) {
  return id.replace(/\\/g, '/')
}

function VitePluginReactRouter(opts: Options = {}): PluginOption {
  const {
    dir = 'src/pages',
    exclude
  } = opts

  let _config: ResolvedConfig
  const EXTS = ['js', 'jsx', 'ts', 'tsx']
  const ROUTE_RE = new RegExp(`\\.(${EXTS.join('|')})$`)
  const MODULE_NAME = 'route-views'
  const VIRTUAL_MODULE = '\0' + MODULE_NAME + `.${EXTS[1]}`

  function createRoutes(folder: string) {
    const originFolder = path.join(_config.root!, dir)
    const originFolderStat = fs.statSync(originFolder)
    let loading = ''

    if (!originFolderStat.isDirectory()) {
      throw new Error(`${folder} must be a folder.`)
    }

    const routes: RouteObject[] = [
      {
        path: '/',
        children: []
      }
    ]

    function normalizedFileName(id: string) {
      const index = id.lastIndexOf('.')
      return index > -1 ? id.slice(0, index) : id
    }

    const getRouteImport = (id: string) => `Lazilize(() => import('${id}'))`

    function readFiles(id: string, route: RouteObject, isDirectory = false, root = false) {
      if (exclude?.(id)) {
        return
      }

      const basename = id.endsWith(dir) ? '/' : path.basename(id)

      if (isDirectory) {
        const files = fs.readdirSync(id)

        files.forEach(file => {
          const nextFile = path.join(id, file)
          const stat = fs.statSync(nextFile)

          if (stat.isDirectory()) {
            const newRoute = { path: path.basename(nextFile) } as RouteObject
            ;(route.children || (route.children = [])).push(newRoute)
            readFiles(nextFile, newRoute, true, false)
          } else {
            readFiles(nextFile, route, false, true)
          }
        })
      } else if (ROUTE_RE.test(basename)) {
        const plainBaseName = normalizedFileName(basename)

        if (root && plainBaseName === '404') {
          routes.push({ path: '*', element: getRouteImport(id) })
        } else if (root && plainBaseName === 'loading') {
          loading = id
        } else if (plainBaseName === 'layout') {
          route.element = getRouteImport(id)
        } else {
          const newRoute = { element: getRouteImport(id) } as RouteObject
          if (plainBaseName === 'index') {
            newRoute.index = true
          } else {
            newRoute.path = /^_/.test(plainBaseName) ? `:${plainBaseName.slice(1)}` : plainBaseName
          }

          ;(route.children || (route.children = [])).push(newRoute)
        }
      }
    }

    readFiles(originFolder, routes[0]!, true, true)

    return { routes, loading }
  }

  return {
    name: 'vite-plugin-react-views',
    configResolved(c) {
      _config = c
    },
    configureServer(server) {
      function handleFileChange(path: string) {
        if (slash(path).includes(dir) && !exclude?.(path)) {
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
        const { loading, routes } = createRoutes(dir)

        return `import { lazy, Suspense } from 'react'
${loading ? `import Loading from '${loading}'` : ''}

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

export default ${JSON.stringify(routes).replace(/"(Lazilize[^,}]+)/g, (_, $1) => $1.slice(0, -1))}`
      }
    },
  }
}

export default VitePluginReactRouter
