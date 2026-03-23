export function Component() {
  return <div className="content">hyphen-name</div>
}

if (import.meta.env.DEV) {
  Component.displayName = 'HyphenName'
}
