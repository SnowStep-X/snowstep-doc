import { getCollection, type CollectionEntry } from 'astro:content'
import { buildBacklinkIndex } from './wiki'

export type Article = CollectionEntry<'articles'>

export async function getAllArticles(): Promise<Article[]> {
  const all = await getCollection('articles', ({ data }) => !data.private)
  return all.sort((a, b) => +new Date(b.data.updated) - +new Date(a.data.updated))
}

export async function getBacklinks(slug: string): Promise<Article[]> {
  const all = await getAllArticles()
  const idx = buildBacklinkIndex(all)
  return idx.get(slug) ?? []
}

type TreeNode = { name: string; children: Map<string, TreeNode>; articles: Article[] }

export function buildCategoryTree(articles: Article[]): TreeNode {
  const root: TreeNode = { name: '', children: new Map(), articles: [] }
  for (const a of articles) {
    let node = root
    for (const seg of a.data.category) {
      if (!node.children.has(seg)) {
        node.children.set(seg, { name: seg, children: new Map(), articles: [] })
      }
      node = node.children.get(seg)!
    }
    node.articles.push(a)
  }
  return root
}
