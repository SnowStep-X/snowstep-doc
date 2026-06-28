# SnowStep Doc Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a half-public, static-first personal learning knowledge base website where you can write Markdown notes, clip docs from tool sites, browse an infinite-depth category tree, and search everything via a global command palette.

**Architecture:** A monorepo with one Astro 3.x app (`apps/web`) for the static site and one Plasmo Chrome/Edge MV3 extension (`apps/extension`) for one-click clipping. Astro Content Collections treat `notes/` and `clipped/` Markdown folders as the source of truth; Tailwind handles styling; Pagefind powers static full-text search; React islands host the CodeMirror 6 editor and command palette; Vercel serves the static build.

**Tech Stack:** Astro 3.x, React 18 (islands), TypeScript, Tailwind CSS 3, CodeMirror 6, markdown-it, shiki, Pagefind, Plasmo, Zod, Vercel, pnpm workspaces.

**Reference spec:** `docs/superpowers/specs/2026-06-28-snowstep-doc-design.md`

**Out of scope for this plan (deferred to v0.5):** the `apps/extension` Plasmo extension. Plan adds a placeholder folder + README note, but the M4 module ships in a follow-up plan once the web app is stable.

---

## File Structure (locked here so tasks stay self-contained)

```
snowstep_doc/
+- package.json                # workspace root
+- pnpm-workspace.yaml
+- .gitignore
+- .editorconfig
+- README.md
+- vercel.json
+- apps/
|   +- web/
|   |   +- package.json
|   |   +- astro.config.mjs
|   |   +- tailwind.config.cjs
|   |   +- tsconfig.json
|   |   +- public/
|   |   |   +- favicon.svg
|   |   |   +- fonts/         # self-hosted Fraunces, Inter, JetBrains Mono
|   |   +- src/
|   |       +- content/
|   |       |   +- config.ts
|   |       |   +- notes/welcome.md
|   |       |   +- clipped/.gitkeep
|   |       +- styles/global.css
|   |       +- components/
|   |       |   +- TopNav.astro
|   |       |   +- Footer.astro
|   |       |   +- ArticleCard.astro
|   |       |   +- TagPill.astro
|   |       |   +- TreeView.astro
|   |       |   +- TableOfContents.astro
|   |       |   +- BacklinksPanel.astro
|   |       +- islands/
|   |       |   +- CommandPalette.tsx
|   |       |   +- Editor.tsx
|   |       +- lib/
|   |       |   +- articles.ts
|   |       |   +- slug.ts
|   |       |   +- wiki.ts
|   |       +- layouts/
|   |       |   +- BaseLayout.astro
|   |       |   +- ArticleLayout.astro
|   |       +- pages/
|   |           +- index.astro
|   |           +- tree.astro
|   |           +- tags/index.astro
|   |           +- tags/[tag].astro
|   |           +- search.astro
|   |           +- about.astro
|   |           +- [...slug].astro
|   +- extension/.gitkeep      # placeholder, real work in v0.5 plan
+- packages/
    +- shared/
        +- package.json
        +- tsconfig.json
        +- src/
            +- index.ts
            +- schema.ts
```

---

## M0 - Workspace + Astro Skeleton + Home Hero

### Task 1: Initialize pnpm workspace

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `.gitignore`
- Create: `.editorconfig`
- Create: `README.md`

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "snowstep_doc",
  "private": true,
  "packageManager": "pnpm@9.0.0",
  "scripts": {
    "dev": "pnpm --filter @snowstep/web dev",
    "build": "pnpm --filter @snowstep/web build",
    "preview": "pnpm --filter @snowstep/web preview"
  }
}
```

- [ ] **Step 2: Write `pnpm-workspace.yaml`**

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

- [ ] **Step 3: Write `.gitignore`**

```
node_modules
dist
.astro
.vercel
.DS_Store
*.log
```

- [ ] **Step 4: Write `.editorconfig`**

```
root = true
[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true
```

- [ ] **Step 5: Write minimal `README.md`**

```markdown
# SnowStep Doc

Personal learning knowledge base. See `docs/superpowers/specs/2026-06-28-snowstep-doc-design.md`.
```

- [ ] **Step 6: Initialize git and commit**

```bash
git init
git add .
git commit -m "chore: initialize pnpm workspace"
```

Expected: `Initialized empty Git repository` then commit succeeds.

---

### Task 2: Scaffold shared schema package

**Files:**
- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Create: `packages/shared/src/schema.ts`
- Create: `packages/shared/src/index.ts`

- [ ] **Step 1: Write `packages/shared/package.json`**

```json
{
  "name": "@snowstep/shared",
  "version": "0.0.0",
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts"
  },
  "dependencies": {
    "zod": "^3.23.0"
  }
}
```

- [ ] **Step 2: Write `packages/shared/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Write `packages/shared/src/schema.ts`**

```ts
import { z } from 'zod'

export const Article = z.object({
  title: z.string(),
  type: z.enum(['note', 'clipped']),
  category: z.array(z.string()).min(1),
  tags: z.array(z.string()).default([]),
  created: z.string(),
  updated: z.string(),
  sourceUrl: z.string().url().optional(),
  siteName: z.string().optional(),
  private: z.boolean().default(false),
})

export type Article = z.infer<typeof Article>
```

- [ ] **Step 4: Write `packages/shared/src/index.ts`**

```ts
export * from './schema'
```

- [ ] **Step 5: Install and commit**

```bash
pnpm install
git add .
git commit -m "feat(shared): add Article frontmatter schema"
```

---

### Task 3: Scaffold Astro app

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/astro.config.mjs`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/.gitignore`

- [ ] **Step 1: Write `apps/web/package.json`**

```json
{
  "name": "@snowstep/web",
  "type": "module",
  "version": "0.0.0",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "check": "astro check"
  },
  "dependencies": {
    "@astrojs/react": "^3.6.0",
    "@astrojs/tailwind": "^5.1.0",
    "@snowstep/shared": "workspace:*",
    "astro": "^4.16.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "tailwindcss": "^3.4.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "typescript": "^5.5.0"
  }
}
```

- [ ] **Step 2: Write `apps/web/astro.config.mjs`**

```js
import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import tailwind from '@astrojs/tailwind'

export default defineConfig({
  integrations: [react(), tailwind()],
  site: 'https://snowstep-doc.vercel.app',
  output: 'static',
})
```

- [ ] **Step 3: Write `apps/web/tsconfig.json`**

```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "react",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

- [ ] **Step 4: Write `apps/web/.gitignore`**

```
node_modules
dist
.astro
```

- [ ] **Step 5: Install and commit**

```bash
pnpm install
git add .
git commit -m "chore(web): scaffold Astro app"
```

---

### Task 4: Tailwind config + design tokens

**Files:**
- Create: `apps/web/tailwind.config.cjs`
- Create: `apps/web/src/styles/global.css`

- [ ] **Step 1: Write `apps/web/tailwind.config.cjs`**

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#0B1220',
          soft: '#1A2236',
          mute: '#5B6478',
        },
        accent: {
          DEFAULT: '#FF6A3D',
          soft: '#FFB199',
        },
        paper: '#F8F5EE',
      },
      fontFamily: {
        serif: ['Fraunces', 'ui-serif', 'Georgia', 'serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      maxWidth: {
        prose: '720px',
      },
    },
  },
  plugins: [],
}
```

- [ ] **Step 2: Write `apps/web/src/styles/global.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --bg: #F8F5EE;
  --fg: #0B1220;
  --muted: #5B6478;
  --accent: #FF6A3D;
}

html.dark {
  --bg: #0B0F1A;
  --fg: #F5F2EC;
  --muted: #9AA3B5;
  --accent: #FF8A5E;
}

html, body {
  background: var(--bg);
  color: var(--fg);
  font-family: 'Inter', system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
}

h1, h2, h3, h4, h5, h6 {
  font-family: 'Fraunces', Georgia, serif;
  letter-spacing: -0.01em;
}

code, pre, kbd, samp {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
}

::selection { background: var(--accent); color: white; }
```

- [ ] **Step 3: Verify build picks up CSS**

```bash
pnpm --filter @snowstep/web dev
```

Expected: dev server starts. Then Ctrl+C.

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat(web): add Tailwind config and design tokens"
```

---

### Task 5: Self-host web fonts

**Files:**
- Create: `apps/web/public/fonts/Fraunces-Variable.woff2`
- Create: `apps/web/public/fonts/Inter-Variable.woff2`
- Create: `apps/web/public/fonts/JetBrainsMono-Variable.woff2`
- Create: `apps/web/src/styles/fonts.css`

- [ ] **Step 1: Download variable woff2 fonts from official sources**

```bash
curl -L -o apps/web/public/fonts/Fraunces-Variable.woff2 https://github.com/undercasetype/Fraunces/raw/main/fonts/variable/Fraunces%5BSOFT%2CWONK%2Copsz%2Cwght%5D.woff2
curl -L -o apps/web/public/fonts/Inter-Variable.woff2 https://github.com/rsms/inter/raw/master/docs/font-files/Inter-roman.var.woff2
curl -L -o apps/web/public/fonts/JetBrainsMono-Variable.woff2 https://github.com/JetBrains/JetBrainsMono/raw/master/fonts/webfonts/JetBrainsMono-Regular.woff2
```

- [ ] **Step 2: Write `apps/web/src/styles/fonts.css`**

```css
@font-face {
  font-family: 'Fraunces';
  src: url('/fonts/Fraunces-Variable.woff2') format('woff2-variations');
  font-weight: 100 900;
  font-display: swap;
}
@font-face {
  font-family: 'Inter';
  src: url('/fonts/Inter-Variable.woff2') format('woff2-variations');
  font-weight: 100 900;
  font-display: swap;
}
@font-face {
  font-family: 'JetBrains Mono';
  src: url('/fonts/JetBrainsMono-Variable.woff2') format('woff2-variations');
  font-weight: 100 900;
  font-display: swap;
}
```

- [ ] **Step 3: Import fonts in `global.css` (add at top)**

Prepend this line to `apps/web/src/styles/global.css`:

```css
@import './fonts.css';
```

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat(web): self-host variable fonts"
```

---

### Task 6: Content Collections + welcome note

**Files:**
- Create: `apps/web/src/content/config.ts`
- Create: `apps/web/src/content/notes/welcome.md`
- Create: `apps/web/src/content/clipped/.gitkeep`

- [ ] **Step 1: Write `apps/web/src/content/config.ts`**

```ts
import { defineCollection, z } from 'astro:content'
import { Article } from '@snowstep/shared'

const articles = defineCollection({
  type: 'content',
  schema: Article,
})

export const collections = { articles }
```

- [ ] **Step 2: Write `apps/web/src/content/notes/welcome.md`**

```markdown
---
title: 欢迎来到 SnowStep
type: note
category: ["杂学"]
tags: ["meta"]
created: 2026-06-28
updated: 2026-06-28
---

# 欢迎

这是你的第一篇笔记。试试：

- 用 `[[welcome]]` 引用本页
- 在分类下新增条目
- 装上 Chrome 扩展一键剪藏工具文档
```

- [ ] **Step 3: Add `.gitkeep` to clipped folder**

```bash
touch apps/web/src/content/clipped/.gitkeep
```

- [ ] **Step 4: Verify collection loads**

```bash
pnpm --filter @snowstep/web dev
```

Expected: no schema errors. Then Ctrl+C.

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat(web): add content collections and welcome note"
```

---

### Task 7: Base layout + Hero home page

**Files:**
- Create: `apps/web/src/layouts/BaseLayout.astro`
- Create: `apps/web/src/components/TopNav.astro`
- Create: `apps/web/src/components/Footer.astro`
- Create: `apps/web/src/components/ArticleCard.astro`
- Create: `apps/web/src/pages/index.astro`

- [ ] **Step 1: Write `apps/web/src/layouts/BaseLayout.astro`**

```astro
---
import '../styles/global.css'
import TopNav from '../components/TopNav.astro'
import Footer from '../components/Footer.astro'

interface Props {
  title: string
  description?: string
}
const { title, description = 'Personal learning knowledge base' } = Astro.props
---
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  </head>
  <body class="min-h-screen flex flex-col">
    <TopNav />
    <main class="flex-1">
      <slot />
    </main>
    <Footer />
    <script is:inline>
      const stored = localStorage.getItem('theme')
      if (stored === 'dark' || (!stored && matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark')
      }
    </script>
  </body>
</html>
```

- [ ] **Step 2: Write `apps/web/src/components/TopNav.astro`**

```astro
---
const links = [
  { href: '/tree', label: '分类' },
  { href: '/tags', label: '标签' },
  { href: '/about', label: '关于' },
]
---
<header class="border-b border-ink/10">
  <div class="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
    <a href="/" class="font-serif text-xl tracking-tight">SnowStep</a>
    <nav class="flex items-center gap-6 text-sm">
      {links.map(l => (
        <a href={l.href} class="hover:text-accent transition-colors">{l.label}</a>
      ))}
      <button
        id="theme-toggle"
        class="ml-2 text-sm px-2 py-1 rounded border border-ink/20 hover:border-accent"
        aria-label="切换主题">◐</button>
    </nav>
  </div>
</header>
<script>
  document.getElementById('theme-toggle')?.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark')
    localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light')
  })
</script>
```

- [ ] **Step 3: Write `apps/web/src/components/Footer.astro`**

```astro
---
const year = new Date().getFullYear()
---
<footer class="border-t border-ink/10 mt-24">
  <div class="max-w-6xl mx-auto px-6 py-8 text-sm text-ink-mute flex justify-between">
    <span>(c) {year} SnowStep</span>
    <span>Built with Astro</span>
  </div>
</footer>
```

- [ ] **Step 4: Write `apps/web/src/components/ArticleCard.astro`**

```astro
---
interface Props {
  title: string
  href: string
  type: 'note' | 'clipped'
  tags: string[]
  excerpt?: string
  date: string
}
const { title, href, type, tags, excerpt, date } = Astro.props
---
<a href={href} class="group block border border-ink/10 rounded-lg p-6 hover:border-accent transition-colors">
  <div class="flex items-center gap-2 text-xs uppercase tracking-wider text-ink-mute mb-3">
    <span>{type === 'note' ? '笔记' : '剪藏'}</span>
    <span>·</span>
    <time>{new Date(date).toLocaleDateString('zh-CN')}</time>
  </div>
  <h3 class="font-serif text-2xl mb-2 group-hover:text-accent transition-colors">{title}</h3>
  {excerpt && <p class="text-ink-mute text-sm line-clamp-2">{excerpt}</p>}
  {tags.length > 0 && (
    <div class="flex gap-2 mt-4">
      {tags.map(t => <span class="text-xs px-2 py-1 rounded bg-ink/5">#{t}</span>)}
    </div>
  )}
</a>
```

- [ ] **Step 5: Write `apps/web/src/pages/index.astro`**

```astro
---
import { getCollection } from 'astro:content'
import BaseLayout from '../layouts/BaseLayout.astro'
import ArticleCard from '../components/ArticleCard.astro'

const all = await getCollection('articles', ({ data }) => !data.private)
const recent = all
  .sort((a, b) => +new Date(b.data.updated) - +new Date(a.data.updated))
  .slice(0, 6)
---
<BaseLayout title="SnowStep - 个人学习知识库">
  <section class="max-w-6xl mx-auto px-6 pt-24 pb-16">
    <h1 class="font-serif text-6xl md:text-8xl tracking-tighter leading-[0.95]">
      慢慢记<br/>
      <span class="text-accent">下每一次成长</span>
    </h1>
    <p class="mt-6 text-lg text-ink-mute max-w-prose">
      这里收集我自己的笔记，以及从各工具官网剪藏下来的文档。一个搜索框找全。
    </p>
  </section>
  <section class="max-w-6xl mx-auto px-6 pb-24">
    <h2 class="font-serif text-3xl mb-8">最近更新</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {recent.map(a => (
        <ArticleCard
          title={a.data.title}
          href={`/${a.slug}`}
          type={a.data.type}
          tags={a.data.tags}
          date={a.data.updated}
        />
      ))}
    </div>
  </section>
</BaseLayout>
```

- [ ] **Step 6: Add a simple favicon**

```bash
mkdir -p apps/web/public
cat > apps/web/public/favicon.svg <<'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" fill="#0B1220"/><text x="16" y="22" text-anchor="middle" font-family="serif" font-size="18" fill="#FF6A3D">S</text></svg>
EOF
```

- [ ] **Step 7: Verify dev server renders home**

```bash
pnpm --filter @snowstep/web dev
```

Open `http://localhost:4321`. Expected: Hero + "最近更新" section with the welcome note card.

- [ ] **Step 8: Commit**

```bash
git add .
git commit -m "feat(web): base layout, top nav, hero home page"
```

---

## M1 - Notes: Editor + Live Preview + Wiki Links

### Task 8: Slug + wiki link utilities

**Files:**
- Create: `apps/web/src/lib/slug.ts`
- Create: `apps/web/src/lib/wiki.ts`

- [ ] **Step 1: Write `apps/web/src/lib/slug.ts`**

```ts
export function fromCategoryPath(path: string[]): string {
  return path.map(encodeURIComponent).join('/')
}

export function fromFileName(name: string): string {
  return name.replace(/\.md$/, '')
}

export function categoryToUrl(path: string[]): string {
  return '/' + fromCategoryPath(path)
}
```

- [ ] **Step 2: Write `apps/web/src/lib/wiki.ts`**

```ts
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
```

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat(web): slug and wiki-link utilities"
```

---

### Task 9: Articles aggregator library

**Files:**
- Create: `apps/web/src/lib/articles.ts`

- [ ] **Step 1: Write `apps/web/src/lib/articles.ts`**

```ts
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
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat(web): articles aggregator with category tree"
```

---

### Task 10: Markdown preview pipeline (markdown-it + shiki)

**Files:**
- Create: `apps/web/src/lib/markdown.ts`

- [ ] **Step 1: Add dependencies to `apps/web/package.json`**

```json
{
  "dependencies": {
    "markdown-it": "^14.1.0",
    "shiki": "^1.22.0"
  }
}
```

- [ ] **Step 2: Install**

```bash
pnpm install
```

- [ ] **Step 3: Write `apps/web/src/lib/markdown.ts`**

```ts
import MarkdownIt from 'markdown-it'
import { createHighlighter } from 'shiki'

const md = new MarkdownIt({ html: true, linkify: true, typographer: true })

let highlighter: Awaited<ReturnType<typeof createHighlighter>> | null = null
async function getHighlighter() {
  if (!highlighter) {
    highlighter = await createHighlighter({
      themes: ['github-light', 'github-dark'],
      langs: ['javascript', 'typescript', 'tsx', 'jsx', 'bash', 'json', 'css', 'html', 'markdown', 'python', 'go', 'rust'],
    })
  }
  return highlighter
}

md.options.highlight = async (str, lang) => {
  const hl = await getHighlighter()
  const theme = document.documentElement.classList.contains('dark') ? 'github-dark' : 'github-light'
  try {
    return hl.codeToHtml(str, { lang, theme })
  } catch {
    return `<pre><code>${md.utils.escapeHtml(str)}</code></pre>`
  }
}

export function renderPreview(source: string): string {
  return md.render(source)
}

export { md }
```

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat(web): markdown-it + shiki preview pipeline"
```

---

### Task 11: CodeMirror 6 editor island

**Files:**
- Create: `apps/web/src/islands/Editor.tsx`

- [ ] **Step 1: Add CodeMirror deps to `apps/web/package.json`**

```json
{
  "dependencies": {
    "@codemirror/lang-markdown": "^6.3.0",
    "@codemirror/state": "^6.4.0",
    "@codemirror/view": "^6.34.0",
    "@codemirror/commands": "^6.7.0",
    "@codemirror/language": "^6.10.0"
  }
}
```

- [ ] **Step 2: Install**

```bash
pnpm install
```

- [ ] **Step 3: Write `apps/web/src/islands/Editor.tsx`**

```tsx
import { useEffect, useRef, useState } from 'react'
import { EditorState } from '@codemirror/state'
import { EditorView, keymap, lineNumbers, highlightActiveLine } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { markdown } from '@codemirror/lang-markdown'
import { renderPreview } from '../lib/markdown'

interface Props {
  initial?: string
  onChange?: (value: string) => void
}

export default function Editor({ initial = '', onChange }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const [value, setValue] = useState(initial)

  useEffect(() => {
    if (!ref.current) return
    const state = EditorState.create({
      doc: initial,
      extensions: [
        lineNumbers(),
        history(),
        highlightActiveLine(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        markdown(),
        EditorView.lineWrapping,
        EditorView.updateListener.of((u) => {
          if (u.docChanged) {
            const v = u.state.doc.toString()
            setValue(v)
            onChange?.(v)
          }
        }),
      ],
    })
    const view = new EditorView({ state, parent: ref.current })
    viewRef.current = view
    return () => view.destroy()
  }, [])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-8rem)]">
      <div ref={ref} className="border border-ink/20 rounded-lg overflow-auto bg-paper" />
      <div
        className="border border-ink/20 rounded-lg overflow-auto p-6 prose"
        dangerouslySetInnerHTML={{ __html: renderPreview(value) }}
      />
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat(web): CodeMirror 6 editor island with live preview"
```

---

### Task 12: Wiki link plugin for CodeMirror

**Files:**
- Modify: `apps/web/src/islands/Editor.tsx`

- [ ] **Step 1: Add decoration dep**

```bash
pnpm --filter @snowstep/web add @codemirror/view
```

(Already present from Task 11; just confirm.)

- [ ] **Step 2: Append a wiki-link decorator to Editor extensions inside the existing `useEffect`**

Add to the `extensions: [` array, **after** `markdown()`:

```ts
import { Decoration, ViewPlugin, ViewUpdate, MatchDecorator } from '@codemirror/view'

const wikiMatcher = new MatchDecorator({
  regexp: /\[\[([^\]]+)\]\]/g,
  decoration: () => Decoration.mark({ class: 'cm-wiki-link' }),
})

const wikiPlugin = ViewPlugin.fromClass(
  class {
    decorations = Decoration.none
    constructor(view: EditorView) { this.decorations = wikiMatcher.createDeco(view) }
    update(u: ViewUpdate) {
      if (u.docChanged || u.viewportChanged) this.decorations = wikiMatcher.createDeco(u.view)
    }
  },
  { decorations: v => v.decorations }
)
```

And push `wikiPlugin` into the `extensions` array.

- [ ] **Step 3: Add CSS in `global.css` (append)**

```css
.cm-wiki-link {
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 12%, transparent);
  border-radius: 3px;
  padding: 0 2px;
}
```

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat(editor): wiki-link decoration"
```

---

### Task 13: Authoring page

**Files:**
- Create: `apps/web/src/pages/edit.astro`

- [ ] **Step 1: Write `apps/web/src/pages/edit.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro'
import Editor from '../islands/Editor.tsx'
---
<BaseLayout title="写笔记 - SnowStep">
  <section class="max-w-7xl mx-auto px-6 py-8">
    <div class="flex items-center justify-between mb-4">
      <h1 class="font-serif text-3xl">写笔记</h1>
      <a href="/" class="text-sm text-ink-mute hover:text-accent"><- 回到首页</a>
    </div>
    <Editor client:only="react" />
  </section>
</BaseLayout>
```

- [ ] **Step 2: Verify in dev server**

```bash
pnpm --filter @snowstep/web dev
```

Open `http://localhost:4321/edit`, type `[[welcome]]`, expect the live preview to show an orange-highlighted wiki link.

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat(web): /edit authoring page"
```

---

## M2 - Category Tree + Tags + Article Detail + Backlinks

### Task 14: Tag pill component

**Files:**
- Create: `apps/web/src/components/TagPill.astro`

- [ ] **Step 1: Write `apps/web/src/components/TagPill.astro`**

```astro
---
interface Props { name: string; count?: number; active?: boolean }
const { name, count, active } = Astro.props
---
<a
  href={`/tags/${encodeURIComponent(name)}`}
  class={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border transition-colors ${active ? 'border-accent text-accent' : 'border-ink/20 hover:border-accent hover:text-accent'}`}
>
  <span>#{name}</span>
  {count !== undefined && <span class="text-ink-mute">{count}</span>}
</a>
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat(web): TagPill component"
```

---

### Task 15: Tree view component

**Files:**
- Create: `apps/web/src/components/TreeView.astro`

- [ ] **Step 1: Write `apps/web/src/components/TreeView.astro`**

```astro
---
import type { Article } from '../lib/articles'

interface Props { node: any; depth?: number }
const { node, depth = 0 } = Astro.props
---
{depth === 0 ? (
  <ul class="space-y-1">
    {[...node.children.values()].sort((a: any, b: any) => a.name.localeCompare(b.name, 'zh-CN')).map((child: any) => (
      <Astro.self node={child} depth={0} />
    ))}
  </ul>
) : (
  <li class="my-1">
    <details open={depth < 1} class="group">
      <summary class="cursor-pointer font-medium flex items-center gap-2 py-1 hover:text-accent">
        <span class="text-ink-mute text-xs group-open:rotate-90 transition-transform">></span>
        {node.name}
        <span class="text-ink-mute text-xs">({node.articles.length})</span>
      </summary>
      {node.articles.length > 0 && (
        <ul class="ml-5 mt-1 border-l border-ink/10 pl-4 space-y-1">
          {node.articles.map((a: Article) => (
            <li>
              <a href={`/${a.slug}`} class="text-sm hover:text-accent flex items-center gap-2">
                <span class="text-ink-mute text-xs">{a.data.type === 'note' ? '.' : 'cmd'}</span>
                <span>{a.data.title}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
      {node.children.size > 0 && (
        <ul class="ml-5 mt-1 border-l border-ink/10 pl-4 space-y-1">
          {[...node.children.values()].sort((a: any, b: any) => a.name.localeCompare(b.name, 'zh-CN')).map((child: any) => (
            <Astro.self node={child} depth={depth + 1} />
          ))}
        </ul>
      )}
    </details>
  </li>
)}
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat(web): TreeView component with recursive render"
```

---

### Task 16: Tree page

**Files:**
- Create: `apps/web/src/pages/tree.astro`

- [ ] **Step 1: Write `apps/web/src/pages/tree.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro'
import TreeView from '../components/TreeView.astro'
import { getAllArticles, buildCategoryTree } from '../lib/articles'

const all = await getAllArticles()
const tree = buildCategoryTree(all)
---
<BaseLayout title="分类 - SnowStep">
  <section class="max-w-3xl mx-auto px-6 py-16">
    <h1 class="font-serif text-5xl mb-8">分类</h1>
    <TreeView node={tree} />
  </section>
</BaseLayout>
```

- [ ] **Step 2: Verify**

Open `/tree`, expect the welcome note nested under 杂学.

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat(web): /tree page with category browser"
```

---

### Task 17: Tags index + tag aggregation pages

**Files:**
- Create: `apps/web/src/pages/tags/index.astro`
- Create: `apps/web/src/pages/tags/[tag].astro`

- [ ] **Step 1: Write `apps/web/src/pages/tags/index.astro`**

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro'
import TagPill from '../../components/TagPill.astro'
import { getAllArticles } from '../../lib/articles'

const all = await getAllArticles()
const counts = new Map<string, number>()
for (const a of all) for (const t of a.data.tags) counts.set(t, (counts.get(t) ?? 0) + 1)
const tags = [...counts.entries()].sort((a, b) => b[1] - a[1])
---
<BaseLayout title="标签 - SnowStep">
  <section class="max-w-3xl mx-auto px-6 py-16">
    <h1 class="font-serif text-5xl mb-8">标签</h1>
    <div class="flex flex-wrap gap-2">
      {tags.map(([name, count]) => <TagPill name={name} count={count} />)}
    </div>
  </section>
</BaseLayout>
```

- [ ] **Step 2: Write `apps/web/src/pages/tags/[tag].astro`**

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro'
import ArticleCard from '../../components/ArticleCard.astro'
import { getAllArticles } from '../../lib/articles'

export async function getStaticPaths() {
  const all = await getAllArticles()
  const set = new Set<string>()
  for (const a of all) for (const t of a.data.tags) set.add(t)
  return [...set].map(tag => ({ params: { tag } }))
}

const { tag } = Astro.params
const all = await getAllArticles()
const matched = all.filter(a => a.data.tags.includes(tag!))
---
<BaseLayout title={`#${tag} - SnowStep`}>
  <section class="max-w-6xl mx-auto px-6 py-16">
    <h1 class="font-serif text-5xl mb-2">#{tag}</h1>
    <p class="text-ink-mute mb-8">{matched.length} 篇文章</p>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {matched.map(a => (
        <ArticleCard
          title={a.data.title}
          href={`/${a.slug}`}
          type={a.data.type}
          tags={a.data.tags}
          date={a.data.updated}
        />
      ))}
    </div>
  </section>
</BaseLayout>
```

- [ ] **Step 3: Verify**

Open `/tags` and `/tags/meta`. Expect tag list + filtered articles.

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat(web): /tags index and per-tag aggregation pages"
```

---

### Task 18: Table of Contents component

**Files:**
- Create: `apps/web/src/components/TableOfContents.astro`

- [ ] **Step 1: Write `apps/web/src/components/TableOfContents.astro`**

```astro
---
import type { MarkdownHeading } from 'astro'

interface Props { headings: MarkdownHeading[] }
const { headings } = Astro.props
const items = headings.filter(h => h.depth >= 2 && h.depth <= 3)
---
{items.length > 0 && (
  <nav class="text-sm">
    <h4 class="font-medium text-ink-mute mb-2 uppercase tracking-wider text-xs">本页目录</h4>
    <ul class="space-y-1 border-l border-ink/10 pl-3">
      {items.map(h => (
        <li class={h.depth === 3 ? 'ml-3' : ''}>
          <a href={`#${h.slug}`} class="text-ink-mute hover:text-accent">{h.text}</a>
        </li>
      ))}
    </ul>
  </nav>
)}
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat(web): TableOfContents component"
```

---

### Task 19: Article layout + dynamic route + backlinks

**Files:**
- Create: `apps/web/src/layouts/ArticleLayout.astro`
- Create: `apps/web/src/components/BacklinksPanel.astro`
- Create: `apps/web/src/pages/[...slug].astro`

- [ ] **Step 1: Write `apps/web/src/components/BacklinksPanel.astro`**

```astro
---
import { getBacklinks } from '../lib/articles'
interface Props { slug: string }
const { slug } = Astro.props
const backlinks = await getBacklinks(slug)
---
{backlinks.length > 0 && (
  <section class="mt-16 pt-8 border-t border-ink/10">
    <h4 class="font-medium text-ink-mute mb-3 uppercase tracking-wider text-xs">被 {backlinks.length} 处引用</h4>
    <ul class="space-y-1">
      {backlinks.map(b => (
        <li>
          <a href={`/${b.slug}`} class="text-sm hover:text-accent"><- {b.data.title}</a>
        </li>
      ))}
    </ul>
  </section>
)}
```

- [ ] **Step 2: Write `apps/web/src/layouts/ArticleLayout.astro`**

```astro
---
import BaseLayout from './BaseLayout.astro'
import TableOfContents from '../components/TableOfContents.astro'
import TagPill from '../components/TagPill.astro'
import BacklinksPanel from '../components/BacklinksPanel.astro'
import type { MarkdownHeading } from 'astro'
import type { Article } from '../lib/articles'

interface Props { article: Article; headings: MarkdownHeading[] }
const { article, headings } = Astro.props
const { data, slug } = article
---
<BaseLayout title={`${data.title} - SnowStep`} description={data.tags.join(', ')}>
  <article class="max-w-6xl mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-12">
    <div class="max-w-prose">
      <header class="mb-10">
        <div class="text-xs uppercase tracking-wider text-ink-mute mb-3 flex items-center gap-2">
          <span>{data.type === 'note' ? '笔记' : '剪藏'}</span>
          <span>·</span>
          <a href="/tree" class="hover:text-accent">{data.category.join(' / ')}</a>
        </div>
        <h1 class="font-serif text-5xl tracking-tight leading-tight">{data.title}</h1>
        {data.tags.length > 0 && (
          <div class="flex gap-2 mt-4 flex-wrap">
            {data.tags.map(t => <TagPill name={t} />)}
          </div>
        )}
        {data.sourceUrl && (
          <p class="text-sm text-ink-mute mt-4">
            来源：<a href={data.sourceUrl} class="text-accent hover:underline" target="_blank" rel="noopener">{data.siteName ?? data.sourceUrl}</a>
          </p>
        )}
      </header>
      <div class="prose prose-lg">
        <slot />
      </div>
      <BacklinksPanel slug={slug} />
    </div>
    <aside class="hidden lg:block">
      <div class="sticky top-8">
        <TableOfContents headings={headings} />
      </div>
    </aside>
  </article>
</BaseLayout>
```

- [ ] **Step 3: Write `apps/web/src/pages/[...slug].astro`**

```astro
---
import { getCollection, type CollectionEntry } from 'astro:content'
import ArticleLayout from '../layouts/ArticleLayout.astro'

export async function getStaticPaths() {
  const all = await getCollection('articles', ({ data }) => !data.private)
  return all.map(entry => ({ params: { slug: entry.slug }, props: { entry } }))
}

interface Props { entry: CollectionEntry<'articles'> }
const { entry } = Astro.props
const { Content, headings } = await entry.render()
---
<ArticleLayout article={entry} headings={headings}>
  <Content />
</ArticleLayout>
```

- [ ] **Step 4: Add a second note to test backlinks**

Create `apps/web/src/content/notes/links-test.md`:

```markdown
---
title: 链接测试
type: note
category: ["杂学"]
tags: ["meta"]
created: 2026-06-28
updated: 2026-06-28
---

这篇用来测试反向链接。引用 [[welcome]] 看看底部会不会列出来。
```

- [ ] **Step 5: Verify**

- Open `/杂学/welcome` -> expect article view with ToC
- Open `/杂学/links-test` -> expect the bottom panel to show "被 1 处引用 -> 欢迎来到 SnowStep"

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat(web): article detail page, ToC, backlinks"
```

---

## M3 - Full-Text Search (Pagefind + cmd+K Palette)

### Task 20: Pagefind build integration

**Files:**
- Modify: `apps/web/package.json`
- Create: `apps/web/scripts/build-pagefind.mjs`

- [ ] **Step 1: Add Pagefind to `apps/web/package.json`**

```json
{
  "devDependencies": {
    "pagefind": "^1.1.0"
  },
  "scripts": {
    "postbuild": "pagefind --site dist"
  }
}
```

- [ ] **Step 2: Install**

```bash
pnpm install
```

- [ ] **Step 3: Build once to generate the index**

```bash
pnpm --filter @snowstep/web build
```

Expected: `dist/pagefind/` directory appears.

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat(web): integrate Pagefind into build"
```

---

### Task 21: Search page

**Files:**
- Create: `apps/web/src/pages/search.astro`

- [ ] **Step 1: Write `apps/web/src/pages/search.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro'
---
<BaseLayout title="搜索 - SnowStep">
  <section class="max-w-3xl mx-auto px-6 py-16">
    <h1 class="font-serif text-5xl mb-8">搜索</h1>
    <input
      id="search-input"
      type="search"
      placeholder="输入关键词，回车搜索..."
      class="w-full text-lg border-b border-ink/20 bg-transparent py-3 focus:outline-none focus:border-accent"
      autocomplete="off"
    />
    <div id="search-results" class="mt-8 space-y-4"></div>
  </section>
</BaseLayout>
<script>
  const input = document.getElementById('search-input') as HTMLInputElement
  const out = document.getElementById('search-results') as HTMLDivElement

  async function run(q: string) {
    if (!q) { out.innerHTML = ''; return }
    const pagefind = await import(/* @vite-ignore */ '/pagefind/pagefind.js')
    const search = await pagefind.search(q)
    const results = await Promise.all(search.results.slice(0, 20).map((r) => r.data()))
    out.innerHTML = results.length
      ? results.map((r) => `
        <a href="${r.url}" class="block border-b border-ink/10 pb-4 hover:text-accent">
          <h2 class="font-serif text-xl">${r.meta.title}</h2>
          <p class="text-sm text-ink-mute mt-1">${r.excerpt.replace(/<[^>]+>/g, '').slice(0, 200)}</p>
        </a>
      `).join('')
      : `<p class="text-ink-mute">没有找到匹配的结果。</p>`
  }

  let timer: number | undefined
  input.addEventListener('input', () => {
    clearTimeout(timer)
    timer = window.setTimeout(() => run(input.value.trim()), 150)
  })
</script>
```

- [ ] **Step 2: Verify**

- Build: `pnpm --filter @snowstep/web build`
- Preview: `pnpm --filter @snowstep/web preview`
- Open `/search`, type `useState` (or 欢迎), expect hits.

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat(web): /search page with Pagefind"
```

---

### Task 22: Global cmd+K command palette

**Files:**
- Create: `apps/web/src/islands/CommandPalette.tsx`
- Modify: `apps/web/src/layouts/BaseLayout.astro`

- [ ] **Step 1: Write `apps/web/src/islands/CommandPalette.tsx`**

```tsx
import { useEffect, useState } from 'react'

export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [hits, setHits] = useState<any[]>([])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen(o => !o)
      } else if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (!open || !q) { setHits([]); return }
    let cancelled = false
    ;(async () => {
      const pf = await import(/* @vite-ignore */ '/pagefind/pagefind.js')
      const s = await pf.search(q)
      const data = await Promise.all(s.results.slice(0, 8).map((r) => r.data()))
      if (!cancelled) setHits(data)
    })()
    return () => { cancelled = true }
  }, [q, open])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-24" onClick={() => setOpen(false)}>
      <div className="bg-paper dark:bg-ink-soft rounded-xl w-full max-w-xl shadow-2xl" onClick={e => e.stopPropagation()}>
        <input
          autoFocus
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="搜笔记、剪藏、标签..."
          className="w-full px-5 py-4 text-lg bg-transparent border-b border-ink/10 focus:outline-none"
        />
        <ul className="max-h-80 overflow-y-auto">
          {hits.map(h => (
            <li key={h.url}>
              <a href={h.url} className="block px-5 py-3 hover:bg-ink/5">
                <div className="font-serif">{h.meta.title}</div>
                <div className="text-xs text-ink-mute mt-1">{h.excerpt.replace(/<[^>]+>/g, '').slice(0, 120)}</div>
              </a>
            </li>
          ))}
          {q && hits.length === 0 && <li className="px-5 py-4 text-ink-mute text-sm">没有匹配</li>}
        </ul>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Mount the island in `BaseLayout.astro`**

Add the import and component just before `</body>`:

```astro
---
import CommandPalette from '../islands/CommandPalette.tsx'
---
...
<CommandPalette client:load />
</body>
```

(Combine with existing imports.)

- [ ] **Step 3: Verify**

`pnpm dev`, press `Cmd/Ctrl+K`, type `welcome`, expect results.

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat(web): global command palette (Cmd+K)"
```

---

## M5 - Visual Polish (Magazine Home + Theme + Motion)

### Task 23: Magazine home page with hero + featured + grid

**Files:**
- Modify: `apps/web/src/pages/index.astro`

- [ ] **Step 1: Replace `apps/web/src/pages/index.astro` content**

```astro
---
import { getCollection } from 'astro:content'
import BaseLayout from '../layouts/BaseLayout.astro'
import ArticleCard from '../components/ArticleCard.astro'

const all = await getCollection('articles', ({ data }) => !data.private)
const recent = all.sort((a, b) => +new Date(b.data.updated) - +new Date(a.data.updated)).slice(0, 6)
const featured = recent[0]
const rest = recent.slice(1)
---
<BaseLayout title="SnowStep - 个人学习知识库">
  <section class="max-w-6xl mx-auto px-6 pt-28 pb-20">
    <p class="text-sm uppercase tracking-[0.3em] text-ink-mute mb-6">Personal Knowledge Base</p>
    <h1 class="font-serif text-[clamp(3rem,9vw,7.5rem)] tracking-tighter leading-[0.9]">
      慢慢记<br/>
      <span class="text-accent italic">下每一次成长</span>
    </h1>
    <p class="mt-8 text-lg text-ink-mute max-w-prose">
      这里收集我自己的笔记，以及从各工具官网剪藏下来的文档。一个搜索框找全。
    </p>
    <div class="mt-10 flex gap-3">
      <a href="/tree" class="px-5 py-2.5 rounded-full bg-ink text-paper dark:bg-paper dark:text-ink text-sm hover:bg-accent transition-colors">浏览分类</a>
      <a href="/edit" class="px-5 py-2.5 rounded-full border border-ink/20 text-sm hover:border-accent transition-colors">写一篇</a>
    </div>
  </section>
  {featured && (
    <section class="max-w-6xl mx-auto px-6 pb-12">
      <a href={`/${featured.slug}`} class="group block relative rounded-2xl overflow-hidden border border-ink/10 hover:border-accent transition-colors">
        <div class="p-10 md:p-16">
          <div class="text-xs uppercase tracking-widest text-accent mb-3">最新文章</div>
          <h2 class="font-serif text-4xl md:text-6xl tracking-tight group-hover:text-accent transition-colors">{featured.data.title}</h2>
          <p class="mt-4 text-ink-mute max-w-prose">{featured.data.tags.map(t => `#${t}`).join(' ')}</p>
        </div>
      </a>
    </section>
  )}
  {rest.length > 0 && (
    <section class="max-w-6xl mx-auto px-6 pb-24">
      <h2 class="font-serif text-3xl mb-8">更多内容</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rest.map(a => (
          <ArticleCard
            title={a.data.title}
            href={`/${a.slug}`}
            type={a.data.type}
            tags={a.data.tags}
            date={a.data.updated}
          />
        ))}
      </div>
    </section>
  )}
</BaseLayout>
```

- [ ] **Step 2: Verify**

Open `/`. Expect a magazine-style hero with featured + grid.

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat(web): magazine-style home page"
```

---

### Task 24: Smooth page transitions + hover micro-interactions

**Files:**
- Modify: `apps/web/src/styles/global.css`

- [ ] **Step 1: Append to `apps/web/src/styles/global.css`**

```css
@media (prefers-reduced-motion: no-preference) {
  a, button { transition: color 200ms ease-out, background-color 200ms ease-out, border-color 200ms ease-out, transform 200ms ease-out; }
  .group:hover { transform: translateY(-2px); }
}

main { animation: fadeIn 150ms ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat(web): subtle hover and page transitions"
```

---

### Task 25: Prose styling for article body

**Files:**
- Modify: `apps/web/tailwind.config.cjs`
- Modify: `apps/web/src/styles/global.css`

- [ ] **Step 1: Add typography plugin**

```bash
pnpm --filter @snowstep/web add -D @tailwindcss/typography
```

- [ ] **Step 2: Register the plugin in `tailwind.config.cjs`**

```js
plugins: [require('@tailwindcss/typography')],
```

- [ ] **Step 3: Ensure `prose` works on dark theme**

Append to `global.css`:

```css
.prose :where(code):not(:where([class~='not-prose'] *))::before,
.prose :where(code):not(:where([class~='not-prose'] *))::after { content: ''; }
.prose pre { background: rgba(0,0,0,0.04); padding: 1rem; border-radius: 8px; overflow-x: auto; }
.dark .prose pre { background: rgba(255,255,255,0.06); }
```

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat(web): typography plugin for article body"
```

---

### Task 26: About page

**Files:**
- Create: `apps/web/src/pages/about.astro`

- [ ] **Step 1: Write `apps/web/src/pages/about.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro'
---
<BaseLayout title="关于 - SnowStep">
  <section class="max-w-prose mx-auto px-6 py-16">
    <h1 class="font-serif text-5xl mb-8">关于</h1>
    <p class="text-lg text-ink-mute mb-4">
      SnowStep 是我自己的学习知识库：一个搜索框找全我写过的笔记和从工具官网剪藏下来的文档。
    </p>
    <p class="text-ink-mute">
      站点由 Astro 静态构建，全部内容以 Markdown 形式存放在 Git 仓库里，可随时迁移、可全文搜索、可离线浏览。
    </p>
  </section>
</BaseLayout>
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "feat(web): /about page"
```

---

## M6 - Deploy (Vercel) + Final Acceptance

### Task 27: Vercel config

**Files:**
- Create: `vercel.json`

- [ ] **Step 1: Write `vercel.json`**

```json
{
  "buildCommand": "pnpm --filter @snowstep/web build",
  "outputDirectory": "apps/web/dist",
  "framework": null,
  "installCommand": "pnpm install"
}
```

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "chore: add Vercel deployment config"
```

---

### Task 28: Lighthouse / performance pass

- [ ] **Step 1: Build production bundle**

```bash
pnpm --filter @snowstep/web build
```

- [ ] **Step 2: Serve preview and run Lighthouse**

```bash
pnpm --filter @snowstep/web preview
```

In another terminal / browser DevTools -> Lighthouse -> run on `/`. Target: Performance >= 95.

- [ ] **Step 3: Fix any low-hanging fruit**

Common candidates:
- Add `loading="lazy"` to images (none yet, skip)
- Inline critical CSS (Astro already does)
- Reduce web font weights (variable fonts are fine)

Document in the PR what was tuned.

- [ ] **Step 4: Commit any tuning**

```bash
git add .
git commit -m "perf: tune for Lighthouse 95+"
```

---

### Task 29: Manual acceptance walkthrough

- [ ] **Step 1: Verify M1 - note writing**

Open `/edit`, write a 200-word note with `[[welcome]]`, copy the markdown into a new file under `apps/web/src/content/notes/`, save, restart dev, open the new note URL. Expect the new note to render and the bottom panel to show 1 backlink.

- [ ] **Step 2: Verify M2 - categories + tags**

Open `/tree`, expand 杂学, see 2 notes. Open `/tags`, click `meta`, see both notes listed.

- [ ] **Step 3: Verify M3 - search**

Open `/search`, type `欢迎`, expect the welcome note hit. Press `Cmd+K` on any page, type `welcome`, expect palette hits.

- [ ] **Step 4: Verify M5 - visual**

Open `/`, expect magazine hero + featured + grid. Toggle dark mode in nav, expect smooth color flip.

- [ ] **Step 5: Document results in PR description**

Create a final commit only if any doc updates are needed:

```bash
git add .
git commit -m "docs: M0-M5 acceptance summary" --allow-empty
```

---

## Buffer

### Task 30: README + screenshots + self-check

- [ ] **Step 1: Update `README.md`** with:
  - One-paragraph description
  - Quickstart (`pnpm i`, `pnpm dev`)
  - Authoring guide (drop a `.md` file into `apps/web/src/content/notes/`)
  - Link to design spec + this plan

- [ ] **Step 2: Self-check**

Run the project's own scripts:

```bash
pnpm install
pnpm --filter @snowstep/web check
pnpm --filter @snowstep/web build
```

Expected: `check` reports 0 errors; `build` succeeds and produces `dist/`.

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "docs: README and acceptance self-check"
```

---

## Self-Review Checklist (run by plan author)

1. **Spec coverage:**
   - M1 Note -> T8-T13 yes
   - M2 Clipped -> T6 (schema) + content folder ready, extension deferred to v0.5 plan yes
   - M3 Tree -> T9, T15, T16 yes
   - M4 Tag -> T14, T17 yes
   - M5 Search -> T20-T22 yes
   - M6 Wiki link / backlinks -> T12, T19 yes
   - M7 Visual + theme -> T23-T25 yes
   - Deploy -> T27-T28 yes
   - Acceptance + buffer -> T29-T30 yes

2. **Placeholder scan:** none of "TBD / TODO / implement later / similar to" appear.

3. **Type consistency:**
   - `Article` from `@snowstep/shared` used in `content/config.ts`, `lib/articles.ts`, `pages/[...slug].astro` - matches.
   - `getAllArticles()`, `getBacklinks()`, `buildCategoryTree()` - same signatures across calls.
   - `fromCategoryPath`, `categoryToUrl` - distinct utilities, used only in tree/tag pages; no collisions.

4. **Known limitation:** Plasmo extension is intentionally out of scope for v1. Add `apps/extension/.gitkeep` to keep the workspace valid; write a follow-up plan for M4.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-28-snowstep-doc.md`. Two execution options:

1. **Subagent-Driven (recommended)** - dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** - execute tasks in this session using executing-plans, batch execution with checkpoints.
