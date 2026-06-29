import { useEffect, useRef, useState, useCallback } from 'react'
import { EditorState } from '@codemirror/state'
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLine,
  Decoration,
  ViewPlugin,
  ViewUpdate,
  MatchDecorator,
} from '@codemirror/view'
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { markdown } from '@codemirror/lang-markdown'
import { renderPreview } from '../lib/markdown'
import {
  type ArticleFrontmatter,
  parseMarkdown,
  buildMarkdown,
  slugify,
  defaultFrontmatter,
} from '../lib/frontmatter'
import {
  loadToken,
  readArticle,
  createOrUpdateArticle,
  deleteArticle as githubDelete,
  GithubError,
} from '../lib/github'

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

const DRAFT_KEY = 'snowstep:drafts'

interface DraftEntry {
  slug: string
  body: string
  frontmatter: ArticleFrontmatter
  savedAt: number
}

function loadDrafts(): Record<string, DraftEntry> {
  if (typeof localStorage === 'undefined') return {}
  try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}') } catch { return {} }
}

function saveDrafts(drafts: Record<string, DraftEntry>) {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(drafts))
}

function b64Decode(b64: string): string {
  const bin = atob(b64.replace(/\n/g, ''))
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return new TextDecoder('utf-8').decode(bytes)
}

interface SaveDialogProps {
  initial: ArticleFrontmatter
  defaultSlug: string
  onCancel: () => void
  onSubmit: (fm: ArticleFrontmatter, slug: string) => void
  busy: boolean
  error: string | null
  onDelete?: () => void
}

function SaveDialog({ initial, defaultSlug, onCancel, onSubmit, busy, error, onDelete }: SaveDialogProps) {
  const [title, setTitle] = useState(initial.title)
  const [slug, setSlug] = useState(defaultSlug)
  const [type, setType] = useState<ArticleFrontmatter['type']>(initial.type)
  const [category, setCategory] = useState(initial.category.join(' / '))
  const [tags, setTags] = useState(initial.tags.join(', '))
  const [sourceUrl, setSourceUrl] = useState(initial.sourceUrl ?? '')
  const [siteName, setSiteName] = useState(initial.siteName ?? '')
  const [isPrivate, setIsPrivate] = useState(initial.private ?? false)
  const [slugTouched, setSlugTouched] = useState(false)

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(title))
  }, [title, slugTouched])

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    const today = new Date().toISOString().slice(0, 10)
    const fm: ArticleFrontmatter = {
      title: title.trim(),
      type,
      category: category.split('/').map(s => s.trim()).filter(Boolean),
      tags: tags.split(',').map(s => s.trim()).filter(Boolean),
      created: initial.created || today,
      updated: today,
      private: isPrivate || undefined,
    }
    if (type === 'clipped') {
      if (sourceUrl.trim()) fm.sourceUrl = sourceUrl.trim()
      if (siteName.trim()) fm.siteName = siteName.trim()
    }
    onSubmit(fm, slug.trim() || slugify(title))
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onCancel}>
      <form
        onClick={e => e.stopPropagation()}
        onSubmit={submit}
        className="bg-paper dark:bg-ink-soft rounded-xl w-full max-w-xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <h2 className="font-serif text-2xl mb-4">保存到 GitHub</h2>
        {error && (
          <div className="mb-4 p-3 rounded bg-red-50 text-red-800 text-sm border border-red-200 whitespace-pre-wrap">{error}</div>
        )}
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">标题</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              className="w-full px-3 py-2 border border-ink/20 rounded bg-transparent focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">文件名 (slug)</label>
            <input
              value={slug}
              onChange={e => { setSlug(e.target.value); setSlugTouched(true) }}
              className="w-full px-3 py-2 border border-ink/20 rounded bg-transparent focus:outline-none focus:border-accent font-mono text-sm"
            />
            <p className="text-xs text-ink-mute mt-1">将作为 <code>apps/web/src/content/articles/&lt;slug&gt;.md</code> 保存</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">类型</label>
              <select
                value={type}
                onChange={e => setType(e.target.value as any)}
                className="w-full px-3 py-2 border border-ink/20 rounded bg-transparent focus:outline-none focus:border-accent"
              >
                <option value="note">笔记</option>
                <option value="clipped">剪藏</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">分类 (用 / 分层)</label>
              <input
                value={category}
                onChange={e => setCategory(e.target.value)}
                placeholder="前端 / React / Hooks"
                className="w-full px-3 py-2 border border-ink/20 rounded bg-transparent focus:outline-none focus:border-accent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">标签 (逗号分隔)</label>
            <input
              value={tags}
              onChange={e => setTags(e.target.value)}
              placeholder="meta, demo"
              className="w-full px-3 py-2 border border-ink/20 rounded bg-transparent focus:outline-none focus:border-accent"
            />
          </div>
          {type === 'clipped' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">来源 URL</label>
                <input
                  value={sourceUrl}
                  onChange={e => setSourceUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-ink/20 rounded bg-transparent focus:outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">来源站名</label>
                <input
                  value={siteName}
                  onChange={e => setSiteName(e.target.value)}
                  className="w-full px-3 py-2 border border-ink/20 rounded bg-transparent focus:outline-none focus:border-accent"
                />
              </div>
            </>
          )}
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isPrivate} onChange={e => setIsPrivate(e.target.checked)} />
            标记为私密 (不出现在公开站点 / 首页)
          </label>
        </div>
        <div className="flex justify-between gap-2 mt-6">
          <div>
            {onDelete && (
              <button
                type="button"
                onClick={() => { if (confirm(`确定删除 "${defaultSlug}" 吗？此操作不可撤销（会从 GitHub 移除文件）。`)) onDelete() }}
                className="px-3 py-2 rounded border border-red-300 text-red-700 text-sm hover:bg-red-50"
              >
                删除文章
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onCancel} className="px-4 py-2 rounded border border-ink/20 text-sm hover:border-accent">
              取消
            </button>
            <button type="submit" disabled={busy} className="px-4 py-2 rounded bg-ink text-paper text-sm hover:bg-accent disabled:opacity-50">
              {busy ? '保存中…' : '保存'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

interface Toast {
  kind: 'success' | 'error' | 'info'
  message: string
  action?: { label: string; href: string }
}

function Toast({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 10000)
    return () => clearTimeout(t)
  }, [onClose])
  const color = toast.kind === 'success' ? 'bg-green-600' : toast.kind === 'error' ? 'bg-red-600' : 'bg-ink'
  return (
    <div className={`fixed top-4 right-4 z-50 ${color} text-paper px-4 py-3 rounded shadow-lg max-w-md flex items-start gap-3`}>
      <span className="text-sm flex-1">{toast.message}</span>
      {toast.action && (
        <a href={toast.action.href} className="text-sm underline whitespace-nowrap">{toast.action.label}</a>
      )}
      <button onClick={onClose} className="text-paper/80 hover:text-paper">×</button>
    </div>
  )
}

export default function Editor() {
  const ref = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const [body, setBody] = useState('')
  const [html, setHtml] = useState('')
  const [showDialog, setShowDialog] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [toast, setToast] = useState<Toast | null>(null)
  const [existingSha, setExistingSha] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [frontmatter, setFrontmatter] = useState<ArticleFrontmatter>(defaultFrontmatter())
  const [editSlug, setEditSlug] = useState<string | null>(null)

  // On mount: decide new vs edit based on ?slug= in URL.
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const slug = params.get('slug')
    if (!slug) {
      setLoaded(true)
      return
    }
    const token = loadToken()
    if (!token) {
      setSaveError('要编辑现有文章需要先配置 GitHub Token。去 /settings 配置。')
      setLoaded(true)
      return
    }
    readArticle(slug, token).then(f => {
      if (!f) {
        setSaveError(`GitHub 上找不到 "${slug}.md"，将作为新建处理。`)
        setEditSlug(slug)
        setLoaded(true)
        return
      }
      const raw = b64Decode(f.content)
      const parsed = parseMarkdown(raw)
      setBody(parsed.body)
      setFrontmatter(parsed.frontmatter ?? defaultFrontmatter())
      setExistingSha(f.sha)
      setEditSlug(slug)
      setLoaded(true)
    }).catch(err => {
      setSaveError(`加载失败: ${err.message}`)
      setLoaded(true)
    })
  }, [])

  // Mount CodeMirror once we have the initial body
  useEffect(() => {
    if (!loaded) return
    if (!ref.current) return
    if (viewRef.current) return // already mounted
    const state = EditorState.create({
      doc: body,
      extensions: [
        lineNumbers(),
        history(),
        highlightActiveLine(),
        keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
        markdown(),
        wikiPlugin,
        EditorView.lineWrapping,
        EditorView.updateListener.of((u) => {
          if (u.docChanged) setBody(u.state.doc.toString())
        }),
      ],
    })
    const view = new EditorView({ state, parent: ref.current })
    viewRef.current = view
    return () => view.destroy()
  }, [loaded, body])

  // Live preview (debounced)
  useEffect(() => {
    if (!loaded) return
    let cancelled = false
    const t = setTimeout(() => {
      renderPreview(body).then(out => { if (!cancelled) setHtml(out) })
    }, 150)
    return () => { cancelled = true; clearTimeout(t) }
  }, [body, loaded])

  // Cmd/Ctrl+S opens save dialog
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        if (!showDialog && loaded) setShowDialog(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showDialog, loaded])

  const performSave = useCallback(async (fm: ArticleFrontmatter, targetSlug: string) => {
    const token = loadToken()
    if (!token) {
      setSaveError('未配置 GitHub Token。请先去 /settings 配置。')
      return
    }
    setSaving(true)
    setSaveError(null)
    try {
      // Re-fetch existing sha at write time to detect concurrent edits
      let sha = existingSha
      if (editSlug || targetSlug) {
        const existing = await readArticle(targetSlug, token)
        if (existing) {
          if (existingSha && existing.sha !== existingSha) {
            setSaveError('GitHub 上的文件已被别人改动。请重新打开编辑器再保存（不要覆盖别人的改动）。')
            setSaving(false)
            return
          }
          sha = existing.sha
        }
      }
      const markdownText = buildMarkdown(fm, body)
      const commitMessage = (editSlug && editSlug === targetSlug)
        ? `docs(notes): update ${targetSlug}`
        : `docs(notes): add ${targetSlug}`
      const result = await createOrUpdateArticle(targetSlug, markdownText, sha, commitMessage, token)
      setExistingSha(result.commitSha)
      setEditSlug(targetSlug)
      setFrontmatter(fm)
      setShowDialog(false)
      const drafts = loadDrafts()
      drafts[targetSlug] = { slug: targetSlug, body, frontmatter: fm, savedAt: Date.now() }
      saveDrafts(drafts)
      setToast({
        kind: 'success',
        message: `已保存到 GitHub。Vercel 会在 ~30s 后重新部署，届时 ${targetSlug} 即可访问。`,
        action: { label: '查看', href: `/${targetSlug}` },
      })
    } catch (err) {
      const msg = err instanceof GithubError ? err.message : (err as Error).message
      setSaveError(`保存失败: ${msg}`)
    } finally {
      setSaving(false)
    }
  }, [body, existingSha, editSlug])

  const performDelete = useCallback(async () => {
    if (!editSlug) return
    const token = loadToken()
    if (!token) { setSaveError('未配置 GitHub Token。'); return }
    if (!existingSha) { setSaveError('找不到远端 sha，无法删除。'); return }
    setSaving(true)
    setSaveError(null)
    try {
      await githubDelete(editSlug, existingSha, `docs(notes): delete ${editSlug}`, token)
      const drafts = loadDrafts()
      delete drafts[editSlug]
      saveDrafts(drafts)
      setToast({ kind: 'success', message: `已从 GitHub 删除 ${editSlug}。`, action: { label: '回到首页', href: '/' } })
      setShowDialog(false)
      setEditSlug(null)
      setExistingSha(null)
      setFrontmatter(defaultFrontmatter())
      setBody('')
      if (viewRef.current) {
        viewRef.current.dispatch({
          changes: { from: 0, to: viewRef.current.state.doc.length, insert: '' }
        })
      }
    } catch (err) {
      const msg = err instanceof GithubError ? err.message : (err as Error).message
      setSaveError(`删除失败: ${msg}`)
    } finally {
      setSaving(false)
    }
  }, [editSlug, existingSha])

  if (!loaded) {
    return <div className="py-20 text-center text-ink-mute">加载中…</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="text-sm text-ink-mute">
          {editSlug
            ? <>编辑: <code className="bg-ink/5 px-1 rounded">{editSlug}</code></>
            : '新建笔记'}
          <span className="ml-3 text-xs">Ctrl/Cmd + S 保存</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setSaveError(null); setShowDialog(true) }}
            className="px-4 py-2 rounded bg-ink text-paper text-sm hover:bg-accent transition-colors"
          >
            保存到 GitHub
          </button>
        </div>
      </div>
      {saveError && !showDialog && (
        <div className="p-3 rounded bg-red-50 text-red-800 text-sm border border-red-200">{saveError}</div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-12rem)]">
        <div ref={ref} className="border border-ink/20 rounded-lg overflow-auto bg-paper" />
        <div
          className="border border-ink/20 rounded-lg overflow-auto p-6 prose"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
      {showDialog && (
        <SaveDialog
          initial={frontmatter}
          defaultSlug={editSlug ?? slugify(frontmatter.title || 'untitled')}
          onCancel={() => { setShowDialog(false); setSaveError(null) }}
          onSubmit={performSave}
          busy={saving}
          error={saveError}
          onDelete={editSlug ? performDelete : undefined}
        />
      )}
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
    </div>
  )
}
