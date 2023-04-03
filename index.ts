import fs from 'node:fs'
import path from 'node:path'
import type { PluginOption, ResolvedConfig } from 'vite'
import type { RouteObject } from 'react-router-dom'

interface Options {
  dir?: string;
  exclude?(path: string): boolean;
  sync?(path: string): boolean;
  extensions?: string[];
}

function slash(id: string) {
  return id.replace(/\\/g, '/')
}

function readContent(id: string) {
  return fs.readFileSync(id).toString().trim()
}

function join(...rest: string[]) {
  return slash(path.join(...rest))
}

function getComponentName(segment: string) {
  if (segment === '404') {
    return 'NoMatch'
  }

  return segment.replace(/[^a-zA-Z0-9_]/g, '')
}

function removeExt(file: string) {
  return file.slice(0, file.length - path.extname(file).length)
}

function toDynamic(segment: string) {
  return segment.replace(/^(?:_(.+)|\[(.+)\])$/, (_, $1, $2) => `:${$1 || $2}`)
}

function VitePluginReactRouter(opts: Options = {}): PluginOption {
  const {
    dir = 'src/pages',
    exclude,
    sync,
    extensions = ['js', 'jsx', 'ts', 'tsx']
  } = opts

  let _config: ResolvedConfig
  let originDirPath: string
  const ROUTE_RE = new RegExp(`\\.(${extensions.join('|')})$`)
  const MODULE_NAME = 'route-views'
  /**
   * Do not add '\0' prefix, the jsx file need to
   * be transformed by @vitejs/plugin-react@^3
   */
  const VIRTUAL_MODULE = MODULE_NAME + `.${extensions[1]}`
  const emptyFiles = new Set()
  const nonEmptyFiles = new Set()

  function createRoutes() {
    originDirPath = join(_config.root, dir)
    let stackDirs = [originDirPath]
    let stackFiles: string[][] = []
    let stackIndexs: number[] = []

    let currentFiles = fs.readdirSync(originDirPath)
    let currentIndex = 0

    let workFile = currentFiles[currentIndex++]
    let workRoute: RouteObject = { path: '/', children: [] }
    let stackRoutes: RouteObject[] = [workRoute]

    let noMatchPath = ''
    let loadingId = ''
    let syncRoutesMap = {}

    const getElement = (id: string) => {
      const routePath = removeExt(id.slice(originDirPath.length))
      if (sync?.(routePath)) {
        let componentName = routePath.split('/').map(s => getComponentName(s)).join('')
        syncRoutesMap[id] = /^[a-zA-Z]/.test(componentName) ? componentName.charAt(0).toUpperCase() + componentName.slice(1) : `Component${componentName}`

        return `<${syncRoutesMap[id]} />`
      }

      return `Lazilize(() => import('${id}'))`
    }

    while (workFile != null) {
      const filePath = join(...stackDirs, workFile)
      const routePath = filePath.slice(originDirPath.length)
      const stat = fs.statSync(filePath)

      if (stat.isDirectory() && !exclude?.(routePath)) {
        const nextFiles = fs.readdirSync(filePath)

        if (nextFiles.length) {
          stackDirs.push(workFile)
          stackFiles.push(currentFiles)
          stackIndexs.push(currentIndex)

          let len = workRoute.children!.push({ path: workFile, children: [] })
          stackRoutes.push(workRoute)

          workRoute = workRoute.children![len - 1]!
          currentIndex = 0
          currentFiles = nextFiles
        }
      } else if (ROUTE_RE.test(workFile) && !exclude?.(removeExt(routePath))) {
        const content = readContent(filePath)
        if (content) {
          nonEmptyFiles.add(filePath)
          const segment = removeExt(workFile)
          const isFirstDepth = stackFiles.length === 0

          if (isFirstDepth && segment === '404') {
            noMatchPath = filePath
          } else if (isFirstDepth && segment === 'loading') {
            syncRoutesMap[loadingId = filePath] = 'Loading'
          } else if (segment === 'layout') {
            workRoute.element = getElement(filePath)
          } else {
            let route = { element: getElement(filePath) } as RouteObject
            if (segment === 'index') {
              route.index = true
            } else {
              route.path = toDynamic(segment)
            }

            workRoute.children?.push(route)
          }
        } else {
          emptyFiles.add(filePath)
        }
      }

      if (currentIndex >= currentFiles.length) {
        currentFiles = stackFiles.pop()!
        currentIndex = stackIndexs.pop()!
        workRoute = stackRoutes.pop()!
        stackDirs.pop()
      }

      if (currentFiles && currentFiles.length) {
        workFile = currentFiles[currentIndex++]
      } else {
        workFile = undefined
      }
    }

    stackRoutes.push(workRoute)
    if (noMatchPath) {
      stackRoutes.push({ path: '*', element: getElement(noMatchPath) })
    }

    return { routes: stackRoutes, loadingId, syncRoutesMap }
  }

  return {
    name: 'vite-plugin-react-views',
    configResolved(c) {
      _config = c
    },
    configureServer(server) {
      function handleFileChange(path: string) {
        path = slash(removeExt(path))

        if (path.includes(dir) && !exclude?.(path.slice(originDirPath.length))) {
          const mod = server.moduleGraph.getModuleById(VIRTUAL_MODULE)
          if (mod) {
            server.moduleGraph.invalidateModule(mod)
          }

          server.ws.send({ type: 'full-reload' })
        }
      }

      server.watcher.on('add', handleFileChange)
      server.watcher.on('unlink', handleFileChange)
      server.watcher.on('change', (path) => {
        path = slash(path)
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
        const { routes, loadingId, syncRoutesMap } = createRoutes()

        return `import { lazy, Suspense } from 'react'
${Object.keys(syncRoutesMap).map(key => `import ${syncRoutesMap[key]} from '${key}'`).join('\n')}

function Lazilize(importFn) {
  const Component = lazy(importFn)
  return (
    <Suspense
      fallback={${syncRoutesMap[loadingId] ? '<Loading />' : 'null'}}
    >
      <Component />
    </Suspense>
  )
}

export default ${JSON.stringify(routes, null, 2)
	.replace(/"(<[A-Z]{1}[^\s]+ \/>)"|"(Lazilize.+\)\))",?/g, (_, $1, $2) => $1 || $2 + ',')}`
      }
    },
  }
}

export default VitePluginReactRouter
