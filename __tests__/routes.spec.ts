import { expect, test } from 'vitest'
import { page } from './utils'
import fs from 'node:fs'
import path from 'node:path'

test('/', async () => {
  expect(await page.textContent('.layout')).toBe('layout')
  expect(await page.textContent('.content')).toBe('index')
})

test('Test synchronous route', async () => {
  expect((await page.content()).includes('id="sync"')).toBeTruthy()
})

test('Nested layout should not be imported synchronously', async () => {
  await page.click('.excluded-components')
  expect(await page.textContent('.no-match-content')).toBe('404')
  
  await page.goBack()
})

test('Should not create Route for excluded directory', async () => {
  expect((await page.content()).includes('id="foo_layout"')).toBeFalsy()
})

test('/contact', async () => {
  await page.click('.contact')
  expect(await page.textContent('.layout')).toBe('layout')
  expect(await page.textContent('.content')).toBe('contact')
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

test('index', async () => {
  await page.click('.index')
  expect(await page.textContent('.layout')).toBe('layout')
  expect(await page.textContent('.content')).toBe('index')
})

test('/utils (exclude)', async () => {
  await page.click('.utils')
  expect(await page.textContent('.no-match-content')).toBe('404')

  await page.goBack()
  expect(page.isHidden('.no-match-content')).toBeTruthy()
  expect(await page.textContent('.layout')).toBe('layout')
  expect(await page.textContent('.content')).toBe('index')
})

if (!process.env.VITEST_BUILD) {
  test('HMR', async () => {
    await page.click('.about')
    expect(await page.textContent('.no-match-content')).toBe('404')

    await page.goBack()

    const aboutFile = path.join(process.cwd(), 'example/src/pages/about.jsx')

    fs.writeFileSync(aboutFile, '')
    await page.click('.about')
    expect(await page.textContent('.no-match-content')).toBe('404')

    fs.writeFileSync(aboutFile, `export default function About() {
  return <div className="content">about</div>
}`)

    expect(await page.textContent('.layout')).toBe('layout')
    expect(await page.textContent('.content')).toBe('about')

    fs.rmSync(aboutFile)
    expect(await page.textContent('.no-match-content')).toBe('404')
  })
}


