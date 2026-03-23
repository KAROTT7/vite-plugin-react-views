export function Component() {
  return 'button'
}

if (import.meta.env.DEV) {
  Component.displayName = 'Button'
}
