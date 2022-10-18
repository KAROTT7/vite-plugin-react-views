import { expect, test } from 'vitest'
import { page } from './utils'
import fs from 'node:fs'
import path from 'node:path'

test('/', async () => {
  expect(await page.textContent('.layout')).toEqual('layout')
  expect(await page.textContent('.content')).toEqual('index')
})

test('/contact', async () => {
  await page.click('.contact')
  expect(await page.textContent('.layout')).toEqual('layout')
  expect(await page.textContent('.content')).toEqual('contact')
})

test('/foo', async () => {
  await page.click('.foo')
  expect(await page.textContent('.layout')).toEqual('layout')
  expect(await page.textContent('.foo-layout')).toEqual('layout-foo')
  expect(await page.textContent('.foo-content')).toEqual('foo')
})

test('/foo/bar', async () => {
  await page.click('.foo-bar')
  expect(await page.textContent('.layout')).toEqual('layout')
  expect(await page.textContent('.foo-layout')).toEqual('layout-foo')
  expect(await page.textContent('.foo-content')).toEqual('bar')
})

test('/foo/:type', async () => {
  await page.click('.foo-type')
  expect(await page.textContent('.layout')).toEqual('layout')
  expect(await page.textContent('.foo-layout')).toEqual('layout-foo')
  expect(await page.textContent('.foo-content')).toEqual('a')
})

test('index', async () => {
  await page.click('.index')
  expect(await page.textContent('.layout')).toEqual('layout')
  expect(await page.textContent('.content')).toEqual('index')
})

test('/utils (exclude)', async () => {
  await page.click('.utils')
  expect(await page.textContent('.no-match-content')).toEqual('404')

  await page.goBack()
  expect(page.isHidden('.no-match-content')).toBeTruthy()
  expect(await page.textContent('.layout')).toEqual('layout')
  expect(await page.textContent('.content')).toEqual('index')
})

if (!process.env.VITEST_BUILD) {
  test('HMR', async () => {
    await page.click('.about')
    expect(await page.textContent('.no-match-content')).toEqual('404')

    await page.goBack()

    const aboutFile = path.join(process.cwd(), 'example/src/pages/about.jsx')
    fs.writeFileSync(aboutFile, `export default function About() {
  return <div className="content">about</div>
}`)

    await page.click('.about')
    expect(await page.textContent('.layout')).toEqual('layout')
    expect(await page.textContent('.content')).toEqual('about')

    fs.rmSync(aboutFile)
  })
}


