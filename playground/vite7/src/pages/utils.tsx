export function Component() {
  return 'utils'
}

if (import.meta.env.DEV) {
  Component.displayName = 'Utils'
}
