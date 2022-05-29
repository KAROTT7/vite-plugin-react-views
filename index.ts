import * as fg from 'fast-glob'
import type { PluginOption } from 'vite'

interface Options {
  dir?: string;
  exclude?(path: string): boolean;
}

interface CreateCodeOptions extends Omit<Options, 'exclude'> {
  layout?: string;
  loading?: string;
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

  return `import { lazy, Suspense } from 'react'
import { useRoutes } from 'react-router-dom'
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

export default function Routes(props) {
  function lazilize(importFn) {
    const Component = lazy(importFn)
    return (
      <Suspense fallback={${loading ? '<Loading {...props} />' : 'null'}}>
        <Component {...props} />
      </Suspense>
    )
  }

  function createRoutes(routes) {
    let o = [], map = {};
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

	const configs = [{
    path: import.meta.env.BASE_URL,
    element: ${layout ? '<Layout {...props} />' : 'undefined'},
    children: createRoutes(routes)
  }]

  ${noMatch ? "configs.push({ path: '*', element: <NoMatch {...props} /> })" : ''}

	return useRoutes(configs)
}`
}

function VitePluginReactRouter(opts: Options = {}): PluginOption {
  const {
    dir = 'src/pages',
    exclude
  } = opts

  let suffix = '.jsx', layout: string, noMatch: string, loading: string

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

    switch (key) {
      case '404':
        noMatch = '/' + fileName
        break
      case 'layout':
        layout = '/' + fileName
        break
      case 'loading':
        loading = '/' + fileName
        break
      default:
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
          loading,
          layout,
          noMatch,
          pages
        })
      }
    },
  }
}

export default VitePluginReactRouter
