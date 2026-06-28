export function fromCategoryPath(path: string[]): string {
  return path.map(encodeURIComponent).join('/')
}

export function fromFileName(name: string): string {
  return name.replace(/\.md$/, '')
}

export function categoryToUrl(path: string[]): string {
  return '/' + fromCategoryPath(path)
}
