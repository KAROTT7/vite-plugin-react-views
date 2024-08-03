import fs from 'node:fs'
import path from 'node:path'
import { init, parse } from 'es-module-lexer'
import { transformWithEsbuild, normalizePath } from 'vite'
import type { PluginOption, ResolvedConfig, EsbuildTransformOptions } from 'vite'
import type { RouteObject } from 'react-router-dom'

interface Options {
  dir?: string;
  exclude?(path: string): boolean;
  sync?(path: string): boolean;
  extensions?: string[];
}

function readContent(id: string) {
  return fs.readFileSync(id).toString().trim()
}

function join(...rest: string[]) {
  return normalizePath(path.join(...rest))
}

function getComponentPrefix(path: string) {
  return path
    .slice(0)
    .split('/')
    .map(segment => segment
                      .replace(/^([a-z])/, (_, $1) => $1.toUpperCase())
                      .replace(/[^a-zA-Z0-9_$]/g, '_')
    )
    .join('')
}

function removeExt(file: string) {
  return file.slice(0, file.length - path.extname(file).length)
}

function toDynamic(segment: string) {
  return segment.replace(/^(?:_(.+)|\[(.+)\])$/, (_, $1, $2) => `:${$1 || $2}`)
}

const splitMark = '__'
const routeArgs = ['Component', 'ErrorBoundary', 'loader', 'action', 'handle', 'shouldRevalidate']
const re = new RegExp(`"(\\(\\) => import\\(.+\\))"|: "(.+${splitMark}(?:${routeArgs.join('|')}))"`, 'g')

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
  const VIRTUAL_MODULE = '\0' + MODULE_NAME + `.${extensions[1]}`
  const emptyFiles = new Set()
  const nonEmptyFiles = new Set()

  async function createRoutes() {
    originDirPath = join(_config.root, dir)
    let stackDirs = [originDirPath]
    let stackFiles: string[][] = []
    let stackIndexs: number[] = []

    let currentFiles = fs.readdirSync(originDirPath)
    let currentIndex = 0

    let workFile: string | undefined = currentFiles[currentIndex++]
    let workRoute: RouteObject = { path: '/', children: [] }
    let stackRoutes: RouteObject[] = [workRoute]

    let syncRoutesMap: Record<string, Record<string, string>> = {}

    async function parseRoute(code: string, id: string, routePath: string) {
      const result = await transformWithEsbuild(code, id, {
        loader: path.extname(id).slice(1) as EsbuildTransformOptions['loader']
      })

      let prefix = getComponentPrefix(removeExt(routePath))
      const route: Record<string, string> = {}

      try {
        await init
        const [, exports] = parse(result.code)
        for (const e of exports) {
          const key = e.n as keyof RouteObject
          if (routeArgs.includes(key)) {
            route[key] = prefix + splitMark + key
          }
        }
      } catch (error) {
        console.error(`[parse error]: `, error)
      }

      syncRoutesMap[id] = { ...route }
      return route
    }

    const getElement = async (id: string, code?: string, routePath?: string, sync?: boolean) => {
      if (sync) {
        return await parseRoute(code!, id, routePath!)
      }

      return { lazy: `() => import('${id}')` as any }
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

          const len: number = workRoute.children!.push({ path: workFile, children: [] })
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
          const isRoot = stackFiles.length === 0

          if (segment === 'layout') {
            Object.assign(workRoute, await getElement(filePath, content, routePath, isRoot))
          } else {
            const route = await getElement(filePath, content, routePath, sync?.(routePath)) as RouteObject

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

      while (currentIndex != null && currentFiles && currentIndex >= currentFiles.length) {
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

    return { routes: stackRoutes.concat(workRoute), syncRoutesMap }
  }

  return {
    name: 'vite-plugin-react-views',
    enforce: 'post',
    configResolved(c) {
      _config = c
    },
    configureServer(server) {
      function handleFileChange(path: string) {
        path = normalizePath(removeExt(path))

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
        path = normalizePath(path)
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
    async load(id) {
      if (id === VIRTUAL_MODULE) {
        const { routes, syncRoutesMap } = await createRoutes()

        return `${Object.keys(syncRoutesMap).map(id => {
            const route = syncRoutesMap[id]
            return `import { ${Object.keys(route).map(routeKey => `${routeKey} as ${route[routeKey]}`).join(', ')} } from '${id}'`
          }).join('\n')}

export default ${JSON.stringify(routes, null, 2)
	.replace(re, (_, $1, $2) => $2 ? `: ${$2}` : $1)}`
      }
    },
  }
}

export default VitePluginReactRouter
