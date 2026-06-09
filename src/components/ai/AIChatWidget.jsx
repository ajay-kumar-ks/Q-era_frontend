import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import { getStoredUser } from '../../services/api'

function Spinner({ small = false }) {
  return (
    <svg className={`animate-spin ${small ? 'h-3 w-3' : 'h-4 w-4'}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  )
}

function Message({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} gap-2`}>
      {!isUser && (
        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
          ✦
        </div>
      )}
      <div
        className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
          isUser
            ? 'rounded-tr-sm bg-indigo-600 text-white'
            : 'rounded-tl-sm bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-100'
        }`}
      >
        {msg.content}
      </div>
    </div>
  )
}

/**
 * AIChatWidget — floating chat bubble available on all pages.
 * Opens an inline panel; provides a link to the full /tutor page.
 */
export default function AIChatWidget() {
  const user = getStoredUser()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    { id: 'welcome', role: 'assistant', content: "Hi! I'm your QERA Tutor. Ask me anything about your studies!" },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversationId, setConversationId] = useState(null)
  const [suggestions, setSuggestions] = useState([])
  const bottomRef = useRef(null)

  // Don't show for unauthenticated users
  if (!user) return null

  // Scroll to bottom when messages change
  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  const send = async (text) => {
    const msg = text || input.trim()
    if (!msg || loading) return

    setInput('')
    setSuggestions([])
    setMessages((prev) => [...prev, { id: Date.now(), role: 'user', content: msg }])
    setLoading(true)

    try {
      const { data } = await api.post('/ai/chat', {
        message: msg,
        conversation_id: conversationId || null,
      })
      setConversationId(data.conversation_id)
      setMessages((prev) => [...prev, { id: Date.now() + 1, role: 'assistant', content: data.reply }])
      setSuggestions(data.follow_up_suggestions || [])
    } catch (err) {
      const detail = err.response?.data?.detail
      if (err.response?.status === 429) {
        setMessages((prev) => [...prev, {
          id: Date.now() + 1,
          role: 'assistant',
          content: 'You\'ve sent too many messages. Please wait a moment before trying again.',
        }])
      } else {
        setMessages((prev) => [...prev, {
          id: Date.now() + 1,
          role: 'assistant',
          content: detail || 'Sorry, I\'m having trouble responding right now. Please try again.',
        }])
      }
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const startNew = () => {
    setConversationId(null)
    setSuggestions([])
    setMessages([{ id: 'welcome', role: 'assistant', content: "New conversation started! What would you like to learn about?" }])
  }

  return (
    <>
      {/* Chat panel — desktop only; mobile users navigate to /tutor */}
      {open && (
        <div className="fixed bottom-20 right-4 z-50 hidden w-[360px] flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 md:flex sm:right-6"
          style={{ height: '520px' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between rounded-t-2xl bg-indigo-600 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">✦</span>
              <div>
                <p className="text-sm font-semibold text-white">QERA Tutor</p>
                <p className="text-xs text-indigo-200">AI-powered study assistant</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/tutor"
                title="Open full tutor page"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-indigo-200 hover:bg-indigo-700 hover:text-white"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </Link>
              <button
                type="button"
                title="New conversation"
                onClick={startNew}
                className="rounded-lg p-1.5 text-indigo-200 hover:bg-indigo-700 hover:text-white"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-indigo-200 hover:bg-indigo-700 hover:text-white"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {messages.map((msg) => <Message key={msg.id} msg={msg} />)}
            {loading && (
              <div className="flex justify-start gap-2">
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">✦</div>
                <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm bg-slate-100 px-4 py-3 dark:bg-slate-700">
                  <Spinner small />
                  <span className="text-xs text-slate-500 dark:text-slate-400">Thinking…</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions */}
          {suggestions.length > 0 && !loading && (
            <div className="flex flex-wrap gap-1.5 border-t border-slate-100 px-4 py-2 dark:border-slate-700">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => send(s)}
                  className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs text-indigo-700 hover:bg-indigo-100 dark:border-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="border-t border-slate-100 px-3 py-3 dark:border-slate-700">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                rows={1}
                placeholder="Ask anything…"
                className="flex-1 resize-none rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                style={{ maxHeight: '96px' }}
              />
              <button
                type="button"
                onClick={() => send()}
                disabled={loading || !input.trim()}
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40"
              >
                {loading ? <Spinner small /> : (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                )}
              </button>
            </div>
            <p className="mt-1 text-center text-xs text-slate-400">Enter to send · Shift+Enter for new line</p>
          </div>
        </div>
      )}

      {/* Floating bubble button — hidden on mobile (use bottom nav instead) */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`fixed bottom-5 right-4 z-50 hidden h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all md:flex sm:right-6 ${
          open ? 'bg-slate-700 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'
        }`}
        title={open ? 'Close tutor' : 'Open AI Tutor'}
      >
        {open ? (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <span className="text-xl font-bold">✦</span>
        )}
      </button>
    </>
  )
}
