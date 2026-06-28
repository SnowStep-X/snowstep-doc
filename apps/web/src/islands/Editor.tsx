import { useEffect, useRef, useState } from 'react'
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
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { markdown } from '@codemirror/lang-markdown'
import { renderPreview } from '../lib/markdown'

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

interface Props {
  initial?: string
  onChange?: (value: string) => void
}

export default function Editor({ initial = '', onChange }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const [value, setValue] = useState(initial)
  const [html, setHtml] = useState('')

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
        wikiPlugin,
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

  useEffect(() => {
    let cancelled = false
    renderPreview(value).then((out) => { if (!cancelled) setHtml(out) })
    return () => { cancelled = true }
  }, [value])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-8rem)]">
      <div ref={ref} className="border border-ink/20 rounded-lg overflow-auto bg-paper" />
      <div
        className="border border-ink/20 rounded-lg overflow-auto p-6 prose"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}
