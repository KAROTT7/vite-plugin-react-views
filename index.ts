import { join } from 'path'
import * as fg from 'fast-glob'
import type { PluginOption } from 'vite'

interface Options {
  dir?: string;
  exclude?(path: string): boolean;
  loading?: string;
}

interface CreateCodeOptions extends Omit<Options, 'exclude'> {
  layout?: string;
  noMatch?: string;
  pages?: string;
}

function createCode(opts: CreateCodeOptions = {}) {
  const {
    dir,
    loading,
    layout,
    noMatch,
    pages
  } = opts

  return `import { lazy, Suspense, useMemo } from 'react'
import { BrowserRouter, useRoutes } from 'react-router-dom'
${loading ? `import Loading from '${loading}'` : ''}
${layout ? `import Layout from '${layout}'` : ''}
${noMatch ? `import NoMatch from '${noMatch}'` : ''}

let pages = ${pages}, layouts = {}, routes = [];
for (const [key, value] of Object.entries(pages)) {
	const path = key.replace('${dir}/', '').replace(${new RegExp('\\.(jsx?|tsx?)')}, '')
	const route = { paths: path.split('/'), value }

	if (path.includes('layout')) {
		layouts[path.replace(${new RegExp('\/?layout')}, '')] = route
	} else {
		routes.push(route)
	}
}

export default function Routes() {
  function lazilize(importFn) {
    const Component = lazy(importFn)
    return (
      <Suspense fallback={${loading ? '<Loading />' : 'null'}}>
        <Component />
      </Suspense>
    )
  }

  function createRoutes(routes) {
    const o = [], map = {};
    routes.forEach((route) => {
      const { paths } = route
      let prevRoutes = o
      for (let i = 0; i < paths.length; ++i) {
        const end = paths[i + 1] === undefined
        const path = paths[i]

        if (end) {
          prevRoutes.push({
            element: lazilize(route.value),
            index: path === 'index',
            path: path === 'index' ? undefined : path
          })
        } else {
          const currentPath = paths.slice(0, i + 1).join('/')
          const existed = map[currentPath]
          if (existed) {
            prevRoutes = existed.children
          } else {
            const layout = layouts[path]
            const route = {
              path,
              element: layout ? lazilize(layout.value) : undefined,
              children: []
            }

            prevRoutes.push(map[currentPath] = route)
            prevRoutes = route.children
          }
        }
      }
    })

    return o
  }

  const o = createRoutes(routes)

	const configs = [{
    path: import.meta.env.BASE_URL,
    element: ${layout ? '<Layout />' : 'undefined'},
    children: o
  }]

  ${noMatch ? "configs.push({ path: '*', element: <NoMatch /> })" : ''}

	return useRoutes(configs)
}`
}

function VitePluginReactRouter(opts: Options = {}): PluginOption {
  const {
    dir = 'src/pages',
    loading,
    exclude
  } = opts

  let suffix = '.jsx', layout: string, noMatch: string

  const moduleName = 'route-views'
  const prefix = '\0'
  const virtualName = prefix + moduleName + suffix

  const files = fg.sync(`${dir}/**/*.{js,jsx,ts,tsx}`)

  let pages = ``
  files.forEach(fileName => {
    const key = fileName.replace(dir + '/', '').replace(/(\..+)$/, (_, $1) => _.replace($1, ''))

    if (exclude && exclude(fileName)) {
      return
    }

    if (key === '404') {
      noMatch = '/' + fileName
    } else if (key === 'layout') {
      layout = '/' + fileName
    } else {
      pages += `'${key}': () => import('/${fileName}'),\n`
    }
  })

  pages = `{\n${pages}}`

  return {
    name: 'vite-plugin-react-views',
    resolveId(id: string) {
      if (id === moduleName) {
        return virtualName
      }
    },
    load(id) {
      if (id === virtualName) {
        return createCode({
          dir: /^\/{1}/.test(dir) ? dir : `/${dir}`,
          loading: loading ? join(process.cwd(), loading) : '',
          layout,
          noMatch,
          pages
        })
      }
    },
  }
}

export default VitePluginReactRouter
