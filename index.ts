import fs from 'node:fs'
import path from 'node:path'
import type { PluginOption, ResolvedConfig } from 'vite'
import type { RouteObject } from 'react-router-dom'

interface Options {
  dir?: string;
  exclude?(path: string): boolean;
  sync?(path: string): boolean;
}

function slash(id: string) {
  return id.replace(/\\/g, '/')
}

function readContent(id: string) {
  return fs.readFileSync(id).toString().trim()
}

function VitePluginReactRouter(opts: Options = {}): PluginOption {
  const {
    dir = 'src/pages',
    exclude,
    sync
  } = opts

  let _config: ResolvedConfig
  const EXTS = ['js', 'jsx', 'ts', 'tsx']
  const ROUTE_RE = new RegExp(`\\.(${EXTS.join('|')})$`)
  const MODULE_NAME = 'route-views'
  const VIRTUAL_MODULE = '\0' + MODULE_NAME + `.${EXTS[1]}`
  const emptyFiles = new Set()
  const nonEmptyFiles = new Set()

  function createRoutes(folder: string) {
    const originFolder = path.join(_config.root!, dir)
    const originFolderStat = fs.statSync(originFolder)

    if (!originFolderStat.isDirectory()) {
      throw new Error(`${folder} must be a folder.`)
    }

    const syncRoutesMap = new Map()
    let loadingId = ''
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

    function getRouteElement(id: string, syncRoute = false) {
      if (syncRoute) {
        const name = id.slice(
          originFolder.length,
          id.indexOf(path.extname(id))
        ).split('/').map(segment => {
          if (segment === '404') {
            return 'NoMatch'
          } else if (segment) {
            return segment.charAt(0).toUpperCase() + segment.slice(1)
          }

          return segment
        }).join('')

        syncRoutesMap.set(id, name)

        return '<' + name + ' />'
      }

      return `Lazilize(() => import('${id}'))`
    }

    function readFiles(id: string, route: RouteObject, isDirectory = false, root = false) {
      if (exclude?.(id)) return

      const basename = id.endsWith(dir) ? '/' : path.basename(id)

      if (isDirectory) {
        const files = fs.readdirSync(id)

        files.forEach(file => {
          const nextFile = path.join(id, file)
          if (exclude?.(nextFile)) return

          const stat = fs.statSync(nextFile)
          if (stat.isDirectory()) {
            const newRoute = { path: path.basename(nextFile) } as RouteObject
            ;(route.children || (route.children = [])).push(newRoute)
            readFiles(nextFile, newRoute, true, false)
          } else {
            readFiles(nextFile, route, false, basename === '/')
          }
        })
      } else if (ROUTE_RE.test(basename)) {
        const content = readContent(id)
        if (!content) {
          emptyFiles.add(id)
          return
        }

        nonEmptyFiles.add(id)
        const plainBaseName = normalizedFileName(basename)
        const isSync = !!sync?.(id)

        if (root && plainBaseName === '404') {
          routes.push({ path: '*', element: getRouteElement(id, isSync) })
        } else if (root && plainBaseName === 'loading') {
          loadingId = id
          getRouteElement(id, true)
        } else if (plainBaseName === 'layout') {
          route.element = getRouteElement(id, root ? true : isSync)
        } else {
          const newRoute = { element: getRouteElement(id, isSync) } as RouteObject
          if (plainBaseName === 'index') {
            newRoute.index = true
          } else {
            if (/^_[^_]+/.test(plainBaseName)) newRoute.path = `:${plainBaseName.slice(1)}`
            else newRoute.path = plainBaseName
          }

          ;(route.children || (route.children = [])).push(newRoute)
        }
      }
    }

    readFiles(originFolder, routes[0]!, true, true)

    return { routes, loadingId, syncRoutesMap }
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
      server.watcher.on('change', (path) => {
        const content = readContent(path)
        if (emptyFiles.has(path) && content) {
          emptyFiles.delete(path)
          nonEmptyFiles.add(path)
          handleFileChange(path)
        } else if (nonEmptyFiles.has(path) && !content) {
          emptyFiles.add(path)
          nonEmptyFiles.delete(path)
          handleFileChange(path)
        }
      })
    },
    resolveId(id: string) {
      if (id === MODULE_NAME) {
        return VIRTUAL_MODULE
      }
    },
    load(id) {
      if (id === VIRTUAL_MODULE) {
        const { routes, loadingId, syncRoutesMap } = createRoutes(dir)
        let syncRouteString = ''
        syncRoutesMap.forEach((value, key) => {
          syncRouteString += `import ${value} from '${key}'\n`
        })

        return `import { lazy, Suspense } from 'react'
${syncRouteString}

function Lazilize(importFn) {
  const Component = lazy(importFn)
  return (
    <Suspense
      fallback={${syncRoutesMap.has(loadingId) ? '<Loading />' : 'null'}}
    >
      <Component />
    </Suspense>
  )
}

export default ${JSON.stringify(routes).replace(/"(Lazilize[^,}]+)/g, (_, $1) => $1.slice(0, -1)).replace(/"(<[A-Z]{1}[^\s]+ \/>)"/g, '$1')}`
      }
    },
  }
}

export default VitePluginReactRouter
