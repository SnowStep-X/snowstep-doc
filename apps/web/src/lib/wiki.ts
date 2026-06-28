import type { CollectionEntry } from 'astro:content'

const WIKI_RE = /\[\[([^\]]+)\]\]/g

export function extractWikiLinks(body: string): string[] {
  const out = new Set<string>()
  for (const m of body.matchAll(WIKI_RE)) out.add(m[1].trim())
  return [...out]
}

export function buildBacklinkIndex(
  entries: CollectionEntry<'articles'>[]
): Map<string, CollectionEntry<'articles'>[]> {
  const idx = new Map<string, CollectionEntry<'articles'>[]>()
  for (const e of entries) {
    for (const link of extractWikiLinks(e.body)) {
      const arr = idx.get(link) ?? []
      arr.push(e)
      idx.set(link, arr)
    }
  }
  return idx
}
