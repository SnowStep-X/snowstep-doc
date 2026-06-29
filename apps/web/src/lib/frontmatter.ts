export interface ArticleFrontmatter {
  title: string
  type: 'note' | 'clipped'
  category: string[]
  tags: string[]
  created: string  // ISO date YYYY-MM-DD
  updated: string
  sourceUrl?: string
  siteName?: string
  private?: boolean
}

export interface ParsedMarkdown {
  frontmatter: ArticleFrontmatter | null
  body: string
}

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/

export function parseMarkdown(raw: string): ParsedMarkdown {
  const m = raw.match(FRONTMATTER_RE)
  if (!m) return { frontmatter: null, body: raw }
  try {
    // Very small YAML subset parser; just enough for our hand-written frontmatter.
    const yaml = m[1]
    const body = m[2]
    const obj: Record<string, unknown> = {}
    for (const line of yaml.split(/\r?\n/)) {
      const trimmed = line.trim()
      if (!trimmed) continue
      const idx = trimmed.indexOf(':')
      if (idx < 0) continue
      const key = trimmed.slice(0, idx).trim()
      let val: unknown = trimmed.slice(idx + 1).trim()
      if (typeof val === 'string') {
        if (val === 'true') val = true
        else if (val === 'false') val = false
        else if ((val as string).startsWith('[') && (val as string).endsWith(']')) {
          val = (val as string).slice(1, -1).split(',').map(s => {
            const t = s.trim().replace(/^["']|["']$/g, '')
            return t
          }).filter(s => s.length > 0)
        } else {
          val = (val as string).replace(/^["']|["']$/g, '')
        }
      }
      obj[key] = val
    }
    return { frontmatter: obj as unknown as ArticleFrontmatter, body }
  } catch {
    return { frontmatter: null, body: raw }
  }
}

export function buildMarkdown(fm: ArticleFrontmatter, body: string): string {
  const lines: string[] = ['---']
  lines.push(`title: ${JSON.stringify(fm.title)}`)
  lines.push(`type: ${fm.type}`)
  lines.push(`category: ${JSON.stringify(fm.category)}`)
  lines.push(`tags: ${JSON.stringify(fm.tags)}`)
  lines.push(`created: ${fm.created}`)
  lines.push(`updated: ${fm.updated}`)
  if (fm.sourceUrl) lines.push(`sourceUrl: ${JSON.stringify(fm.sourceUrl)}`)
  if (fm.siteName) lines.push(`siteName: ${JSON.stringify(fm.siteName)}`)
  if (fm.private) lines.push('private: true')
  lines.push('---')
  lines.push('')
  // Strip leading newlines from body so the file starts cleanly after the frontmatter
  const trimmedBody = body.replace(/^\n+/, '')
  return lines.join('\n') + '\n' + trimmedBody
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/[^\p{L}\p{N}\-]+/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80) || 'untitled'
}

export function defaultFrontmatter(): ArticleFrontmatter {
  const today = new Date().toISOString().slice(0, 10)
  return {
    title: '',
    type: 'note',
    category: ['杂学'],
    tags: [],
    created: today,
    updated: today,
  }
}
