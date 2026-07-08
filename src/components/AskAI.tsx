import { createContext, useContext, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { Boxes, Box, Bell, Flame, LineChart, FileText, Layers, Send, Sparkles, X } from 'lucide-react'
import { useEnv } from '../state/env'
import { getAskAIContext } from '../mock/askai'
import type { AskAIContext } from '../mock/askai'
import { ConfidencePill } from './Confidence'

/* ---------- open/close state, shared via context ---------- */

const AskAIStateContext = createContext<{ open: boolean; setOpen: (o: boolean) => void } | null>(null)

export function AskAIProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <AskAIStateContext.Provider value={{ open, setOpen }}>{children}</AskAIStateContext.Provider>
  )
}

export function useAskAI() {
  const ctx = useContext(AskAIStateContext)
  if (!ctx) throw new Error('useAskAI must be used inside <AskAIProvider>')
  return ctx
}

/* ---------- topbar trigger — present on every surface ---------- */

export function AskAIButton() {
  const { open, setOpen } = useAskAI()
  return (
    <button
      className={`askai-btn${open ? ' active' : ''}`}
      onClick={() => setOpen(!open)}
      aria-expanded={open}
      aria-controls="askai-panel"
    >
      {/* Flat, monochrome — no gradient tile (DEV-27). Sparkle icon at 16px,
         Lucide outline per iconography spec. */}
      <Sparkles size={16} strokeWidth={2.1} className="askai-btn-icon" />
      Ask AI
    </button>
  )
}

/* ---------- the panel (Screen 66) ---------- */

const REF_ICONS = {
  env: Layers,
  alert: Bell,
  incident: Flame,
  cluster: Boxes,
  pod: Box,
  metric: LineChart,
  logs: FileText,
  view: Layers,
} as const

interface Message {
  role: 'user' | 'ai'
  text: string
  confidence?: number
  sources?: string[]
}

/* Fixed 360px side panel (DEV-16 resolution); full-width bottom sheet under
   900px. No backdrop, no focus trap — the page stays interactive (not a
   modal). One component, every surface; only context differs. */
const MIN_W = 320
const MAX_W = 620

export function AskAIPanel() {
  const { open, setOpen } = useAskAI()
  const location = useLocation()
  const { env } = useEnv()
  const [messages, setMessages] = useState<Message[]>([])
  const [thinking, setThinking] = useState(false)
  const [draft, setDraft] = useState('')
  const bodyRef = useRef<HTMLDivElement>(null)
  const ctx: AskAIContext = getAskAIContext(location.pathname, env.name)

  /* DEV-16: panel is resizable on desktop (clamped + persisted); the mobile
     bottom sheet ignores this via the media query. */
  const [width, setWidth] = useState<number>(() => {
    const stored = Number(localStorage.getItem('rtifact.askai.w'))
    return stored >= MIN_W && stored <= MAX_W ? stored : 360
  })
  const dragging = useRef(false)

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return
      setWidth(Math.min(MAX_W, Math.max(MIN_W, window.innerWidth - e.clientX)))
    }
    const onUp = () => {
      if (!dragging.current) return
      dragging.current = false
      document.body.style.userSelect = ''
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('rtifact.askai.w', String(width))
  }, [width])

  /* context switch (new surface) resets the conversation */
  useEffect(() => {
    setMessages([])
    setThinking(false)
  }, [ctx.surface])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, setOpen])

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight })
  }, [messages, thinking])

  const ask = (q: string) => {
    if (!q.trim() || thinking) return
    setMessages((m) => [...m, { role: 'user', text: q }])
    setDraft('')
    setThinking(true)
    setTimeout(() => {
      setThinking(false)
      setMessages((m) => [
        ...m,
        { role: 'ai', text: ctx.answer.text, confidence: ctx.answer.confidence, sources: ctx.answer.sources },
      ])
    }, 1100)
  }

  if (!open) return null

  return (
    <aside
      id="askai-panel"
      className="askai-panel"
      aria-label="Ask Rtifact AI"
      style={{ ['--askai-w' as string]: `${width}px` }}
    >
      <div
        className="askai-resize"
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize panel"
        title="Drag to resize"
        onPointerDown={(e) => {
          e.preventDefault()
          dragging.current = true
          document.body.style.userSelect = 'none'
        }}
      />
      <header className="askai-head">
        <span className="ai-tile">
          <Sparkles size={15} strokeWidth={2} />
        </span>
        <span className="askai-title">
          Ask Rtifact AI
          <span className="askai-surface">{ctx.surface}</span>
        </span>
        <button className="askai-close" onClick={() => setOpen(false)} aria-label="Close Ask AI">
          <X size={16} strokeWidth={2.2} />
        </button>
      </header>

      {/* reference-attaching mechanism: exactly what's in context */}
      <div className="askai-refs" aria-label="In context">
        <span className="askai-refs-label">In context</span>
        {ctx.references.map((r) => {
          const Icon = REF_ICONS[r.kind]
          return (
            <span key={`${r.kind}-${r.label}`} className="askai-ref mono">
              <Icon size={11} strokeWidth={2.2} />
              {r.label}
            </span>
          )
        })}
      </div>

      <div className="askai-body" ref={bodyRef}>
        {messages.length === 0 && !thinking && (
          <>
            <div className="askai-hint">Suggested for this surface</div>
            {ctx.suggestions.map((s) => (
              <button key={s} className="askai-suggestion" onClick={() => ask(s)}>
                {s}
              </button>
            ))}
          </>
        )}

        {messages.map((m, i) =>
          m.role === 'user' ? (
            <div key={i} className="askai-msg user">
              {m.text}
            </div>
          ) : (
            <div key={i} className="askai-msg ai">
              <p>{m.text}</p>
              {m.confidence !== undefined && <ConfidencePill value={m.confidence} />}
              {m.sources && (
                <div className="askai-sources">
                  {m.sources.map((s) => (
                    <span key={s} className="askai-source mono">
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ),
        )}

        {thinking && (
          <div className="askai-msg ai thinking" aria-label="Rtifact AI is thinking">
            <span className="think-dot" />
            <span className="think-dot" />
            <span className="think-dot" />
          </div>
        )}
      </div>

      <form
        className="askai-input"
        onSubmit={(e) => {
          e.preventDefault()
          ask(draft)
        }}
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={`Ask about ${ctx.surface.toLowerCase()}…`}
          aria-label="Ask Rtifact AI"
        />
        <button type="submit" className="askai-send" disabled={!draft.trim() || thinking} aria-label="Send">
          <Send size={14} strokeWidth={2.2} />
        </button>
      </form>
    </aside>
  )
}
