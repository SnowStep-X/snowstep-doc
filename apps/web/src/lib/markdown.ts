import MarkdownIt from 'markdown-it'
import type { Highlighter } from 'shiki'

const md = new MarkdownIt({ html: true, linkify: true, typographer: true })

let highlighter: Highlighter | null = null
async function getHighlighter(): Promise<Highlighter> {
  if (!highlighter) {
    const { createHighlighter } = await import('shiki')
    highlighter = await createHighlighter({
      themes: ['github-light', 'github-dark'],
      langs: ['javascript', 'typescript', 'tsx', 'jsx', 'bash', 'json', 'css', 'html', 'markdown', 'python', 'go', 'rust'],
    })
  }
  return highlighter
}

export async function renderPreview(source: string): Promise<string> {
  const hl = await getHighlighter()
  md.options.highlight = (str: string, lang: string) => {
    const theme = typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
      ? 'github-dark'
      : 'github-light'
    try {
      return hl.codeToHtml(str, { lang, theme })
    } catch {
      return `<pre><code>${md.utils.escapeHtml(str)}</code></pre>`
    }
  }
  return md.render(source)
}

export { md }
