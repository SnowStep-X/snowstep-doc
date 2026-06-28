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
      } else if (e.key === 'Escape') {
        setOpen(false)
      }
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
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-24"
      onClick={() => setOpen(false)}
    >
      <div
        className="bg-paper dark:bg-ink-soft rounded-xl w-full max-w-xl shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <input
          autoFocus
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="搜笔记、剪藏、标签…"
          className="w-full px-5 py-4 text-lg bg-transparent border-b border-ink/10 focus:outline-none"
        />
        <ul className="max-h-80 overflow-y-auto">
          {hits.map(h => (
            <li key={h.url}>
              <a href={h.url} className="block px-5 py-3 hover:bg-ink/5">
                <div className="font-serif">{h.meta.title}</div>
                <div className="text-xs text-ink-mute mt-1">
                  {h.excerpt.replace(/<[^>]+>/g, '').slice(0, 120)}
                </div>
              </a>
            </li>
          ))}
          {q && hits.length === 0 && (
            <li className="px-5 py-4 text-ink-mute text-sm">没有匹配</li>
          )}
        </ul>
      </div>
    </div>
  )
}
