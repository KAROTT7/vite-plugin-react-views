import path from 'node:path'
import { chromium } from 'playwright-chromium'
import { createServer, build, preview, loadConfigFromFile, mergeConfig } from 'vite'
import { beforeAll } from 'vitest'
import type { InlineConfig, ViteDevServer } from 'vite'
import type { BrowserServer, Page, Browser } from 'playwright-chromium'

const isBuild = !!process.env.VITEST_BUILD
let testConfig: InlineConfig
let server: ViteDevServer

let browserServer: BrowserServer
let browser: Browser
export let page: Page

beforeAll(async () => {
  browserServer = await chromium.launchServer()
  browser = await chromium.connect(browserServer.wsEndpoint())
  page = await browser.newPage()

  try {
    await startPrepare()
  } catch (e) {
    await server?.close()
    throw e
  }

  return async () => {
    await server?.close()
    await page.close()
    await browser.close()
    await browserServer.close()
  }
})

async function startPrepare() {
  const testDir = path.resolve(process.cwd(), 'example')
  const res = await loadConfigFromFile(
    {
      command: isBuild ? 'build' : 'serve',
      mode: isBuild ? 'production' : 'development'
    },
    undefined,
    testDir
  )

  const options: InlineConfig = {
    root: testDir,
    configFile: false,
    build: {
      target: 'esnext'
    }
  }

  testConfig = mergeConfig(options, res ? res.config : {})
  if (isBuild) {
    await build(testConfig)
    const previewServer = await preview(testConfig)
    await page.goto(previewServer.resolvedUrls.local[0]!)
  } else {
    server = await (await createServer(testConfig)).listen()
    await page.goto(`http://localhost:${server.config.server.port}`)
  }
}
