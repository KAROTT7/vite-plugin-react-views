import { expect, test } from 'vitest'
import { page } from './utils'
import fs from 'node:fs'
import path from 'node:path'

test('/', async () => {
  expect(await page.textContent('.layout')).toBe('layout')
  expect(await page.textContent('.content')).toBe('index')
})

test('Test root layout\'s loader', async () => {
  expect(await page.textContent('.layout-loader-data')).toBe('root')
})

test('Test synchronous route', async () => {
  expect((await page.content()).includes('id="sync"')).toBeTruthy()
})

test('Nested layout should not be imported synchronously', async () => {
  expect((await page.content()).includes('id="foo_layout"')).toBeFalsy()
})

test('Should not create Route for excluded directory', async () => {
  await page.click('.excluded-components')
  expect(await page.textContent('.route-error')).toContain('404 Not Found')
  await page.goBack()
})

test('/contact', async () => {
  await page.click('.contact')
  expect(await page.textContent('.layout')).toBe('layout')
  expect(await page.textContent('.content')).toBe('contact')
})

test('/bar/:dynamic (test dynamic route format `[name]`)', async () => {
  await page.click('.bar-dynamic')
  expect(await page.textContent('.layout')).toBe('layout')
  expect(await page.textContent('.dynamic')).toBe('dynamic')
})

test('/foo', async () => {
  await page.click('.foo')
  expect(await page.textContent('.layout')).toBe('layout')
  expect(await page.textContent('.foo-layout')).toBe('layout-foo')
  expect(await page.textContent('.foo-content')).toBe('foo')
})

test('/foo/bar', async () => {
  await page.click('.foo-bar')
  expect(await page.textContent('.layout')).toBe('layout')
  expect(await page.textContent('.foo-layout')).toBe('layout-foo')
  expect(await page.textContent('.foo-content')).toBe('bar')
})

test('/foo/:type', async () => {
  await page.click('.foo-type')
  expect(await page.textContent('.layout')).toBe('layout')
  expect(await page.textContent('.foo-layout')).toBe('layout-foo')
  expect(await page.textContent('.foo-content')).toBe('a')
})

test('hyphen-name', async () => {
  await page.click('.hyphen-name')
  expect(await page.textContent('.layout')).toBe('layout')
  expect(await page.textContent('.content')).toBe('hyphen-name')
})

test('index', async () => {
  await page.click('.index')
  expect(await page.textContent('.layout')).toBe('layout')
  expect(await page.textContent('.content')).toBe('index')
})

test('/utils (exclude)', async () => {
  await page.click('.utils')
  expect(await page.textContent('.route-error')).toContain('404 Not Found')

  await page.goBack()
  expect(await page.textContent('.layout')).toBe('layout')
  expect(await page.textContent('.content')).toBe('index')
})

if (!process.env.VITEST_BUILD) {
  test('HMR', async () => {
    await page.click('.about')
    expect(await page.textContent('.route-error')).toContain('404 Not Found')

    await page.goBack()
    await page.click('.about')
    expect(await page.textContent('.route-error')).toContain('404 Not Found')

    const aboutFile = path.join(process.cwd(), 'example/src/pages/about.jsx')
    fs.writeFileSync(aboutFile, '')
    fs.writeFileSync(aboutFile, `export function Component() {
  return <div className="content">about</div>
}`)

    expect(await page.textContent('.layout')).toBe('layout')
    expect(await page.textContent('.content')).toBe('about')

    fs.rmSync(aboutFile)
  })
}


