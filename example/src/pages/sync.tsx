const el = document.createElement('div')
el.id = 'sync'
document.body.appendChild(el)

export function Component() {
  return 'sync'
}

if (import.meta.env.DEV) {
  Component.displayName = 'SyncRoute'
}
