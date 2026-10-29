'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowUp, Bot, Loader2, Sparkles } from 'lucide-react'

type Message = { role: 'user' | 'agent'; text: string; error?: boolean }

const SUGGESTIONS = (project: string) => [
  `What should I improve in ${project} first?`,
  'Review my CI setup for gaps',
  'Suggest one feature worth building next',
]

export default function AgentPanel({ project }: { project: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const scroller = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const el = scroller.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, busy])

  async function ask(question: string) {
    const prompt = question.trim()
    if (!prompt || busy) return
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', text: prompt }])
    setBusy(true)
    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, project }),
      })
      const data = (await res.json()) as { text?: string; error?: string; detail?: string }
      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'agent',
            error: true,
            text: data.error
              ? `${data.error}${data.detail ? `\n\n${data.detail}` : ''}`
              : 'The agent could not answer that request.',
          },
        ])
      } else {
        setMessages((prev) => [...prev, { role: 'agent', text: data.text || 'No answer returned.' }])
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'agent', error: true, text: 'Network error while contacting the agent.' },
      ])
    } finally {
      setBusy(false)
    }
  }

  return (
    <aside className="rail" aria-label="Build agent">
      <div className="rail-title">
        <Bot size={15} />
        Build agent
        <span className="chip">live</span>
      </div>

      <div className="chat" ref={scroller}>
        {messages.length === 0 && (
          <div className="bubble agent">
            I can answer questions about <strong>{project}</strong>: structure, tests, CI, what to
            build next. I read nothing from your machine and I cannot deploy.
          </div>
        )}
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={`bubble ${message.role === 'user' ? 'user' : message.error ? 'error' : 'agent'}`}
          >
            {message.text}
          </div>
        ))}
        {busy && (
          <div className="bubble agent" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Loader2 size={13} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
            Thinking…
          </div>
        )}
      </div>

      <div className="chips">
        {SUGGESTIONS(project).slice(0, messages.length ? 2 : 3).map((suggestion) => (
          <button key={suggestion} className="suggestion" onClick={() => ask(suggestion)}>
            <Sparkles size={10} style={{ marginRight: 4, verticalAlign: -1 }} />
            {suggestion}
          </button>
        ))}
      </div>

      <form
        className="composer"
        onSubmit={(event) => {
          event.preventDefault()
          void ask(input)
        }}
      >
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault()
              void ask(input)
            }
          }}
          placeholder={`Ask about ${project}…`}
          rows={2}
        />
        <div className="composer-row">
          <span>Enter to send · Shift + Enter for a new line</span>
          <button className="btn primary" type="submit" disabled={busy || !input.trim()}>
            <ArrowUp size={14} />
            Send
          </button>
        </div>
      </form>
    </aside>
  )
}
