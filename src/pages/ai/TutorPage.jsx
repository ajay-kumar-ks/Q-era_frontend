import { useEffect, useRef, useState } from 'react'
import api from '../../services/api'

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  )
}

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} gap-3`}>
      {!isUser && (
        <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
          ✦
        </div>
      )}
      <div className={`max-w-[75%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? 'rounded-tr-sm bg-indigo-600 text-white'
              : 'rounded-tl-sm bg-white text-slate-800 shadow-sm dark:bg-slate-800 dark:text-slate-100'
          }`}
        >
          {msg.content}
        </div>
        <span className="px-1 text-xs text-slate-400">
          {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
        </span>
      </div>
      {isUser && (
        <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-300 text-xs font-bold text-slate-700 dark:bg-slate-600 dark:text-slate-200">
          You
        </div>
      )}
    </div>
  )
}

export default function TutorPage() {
  const [conversations, setConversations] = useState([])
  const [activeConvId, setActiveConvId] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [topic, setTopic] = useState('')
  const bottomRef = useRef(null)

  // Load conversations list
  useEffect(() => {
    api.get('/ai/chat/conversations').then(({ data }) => setConversations(data || [])).catch(() => {})
  }, [])

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadConversation = async (convId) => {
    setActiveConvId(convId)
    setSuggestions([])
    setLoadingHistory(true)
    try {
      const { data } = await api.get(`/ai/chat/conversations/${convId}`)
      setMessages(data || [])
    } catch {
      setMessages([])
    } finally {
      setLoadingHistory(false)
    }
  }

  const startNew = () => {
    setActiveConvId(null)
    setSuggestions([])
    setMessages([])
    setTopic('')
  }

  const send = async (text) => {
    const msg = (text || input).trim()
    if (!msg || loading) return

    setInput('')
    setSuggestions([])
    const tempId = Date.now()
    setMessages((prev) => [...prev, { id: tempId, role: 'user', content: msg, created_at: new Date().toISOString() }])
    setLoading(true)

    try {
      const { data } = await api.post('/ai/chat', {
        message: msg,
        conversation_id: activeConvId || null,
        context: topic ? { current_topic: topic } : null,
      })

      if (!activeConvId) {
        setActiveConvId(data.conversation_id)
        // Refresh conversation list
        const listRes = await api.get('/ai/chat/conversations')
        setConversations(listRes.data || [])
      } else {
        // Update title in sidebar
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConvId
              ? { ...c, last_message: data.reply, updated_at: new Date().toISOString() }
              : c
          )
        )
      }

      setMessages(data.messages || [])
      setSuggestions(data.follow_up_suggestions || [])
    } catch (err) {
      const detail = err.response?.data?.detail
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          role: 'assistant',
          content: err.response?.status === 429
            ? 'You\'ve sent too many messages recently. Please wait a moment.'
            : detail || 'Sorry, I\'m having trouble responding. Please try again.',
          created_at: new Date().toISOString(),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const deleteConversation = async (convId, e) => {
    e.stopPropagation()
    try {
      await api.delete(`/ai/chat/conversations/${convId}`)
      setConversations((prev) => prev.filter((c) => c.id !== convId))
      if (activeConvId === convId) startNew()
    } catch {}
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-64px)] max-w-7xl overflow-hidden">

      {/* Sidebar — conversation history */}
      <aside className="hidden w-64 flex-shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 lg:flex">
        <div className="border-b border-slate-200 p-4 dark:border-slate-700">
          <button
            type="button"
            onClick={startNew}
            className="w-full rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            + New conversation
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {conversations.length === 0 && (
            <p className="px-3 py-4 text-xs text-slate-400">No conversations yet. Start chatting!</p>
          )}
          {conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => loadConversation(conv.id)}
              className={`group flex cursor-pointer items-start justify-between gap-2 rounded-xl px-3 py-2.5 transition-colors ${
                activeConvId === conv.id
                  ? 'bg-indigo-50 dark:bg-indigo-900/30'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{conv.title}</p>
                {conv.last_message && (
                  <p className="mt-0.5 truncate text-xs text-slate-400">{conv.last_message}</p>
                )}
              </div>
              <button
                type="button"
                onClick={(e) => deleteConversation(conv.id, e)}
                className="mt-0.5 hidden flex-shrink-0 rounded p-0.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 group-hover:block dark:hover:bg-rose-900/30"
                title="Delete conversation"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </aside>

      {/* Main chat area */}
      <div className="flex flex-1 flex-col bg-slate-50 dark:bg-slate-950">

        {/* Top bar */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-base font-bold text-white">✦</div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">QERA AI Tutor</p>
              <p className="text-xs text-slate-400">Ask me anything about your studies</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Current topic (optional)"
              className="hidden rounded-lg border border-slate-300 px-3 py-1.5 text-xs dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 sm:block"
            />
            <button
              type="button"
              onClick={startNew}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              New chat
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-6 sm:px-6">
          {loadingHistory && (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          )}

          {!loadingHistory && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-3xl dark:bg-indigo-900/30">✦</div>
              <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">How can I help you today?</h2>
              <p className="mt-2 max-w-sm text-sm text-slate-500">
                Ask me to explain a concept, quiz you on a topic, or help you understand a problem.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {[
                  "Explain Newton's third law with examples",
                  "What is the difference between mitosis and meiosis?",
                  "Help me understand recursion in programming",
                  "Quiz me on World War II dates",
                ].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm hover:border-indigo-300 hover:bg-indigo-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!loadingHistory && messages.map((msg) => (
            <MessageBubble key={msg.id || msg.created_at} msg={msg} />
          ))}

          {loading && (
            <div className="flex justify-start gap-3">
              <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">✦</div>
              <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm bg-white px-4 py-3 shadow-sm dark:bg-slate-800">
                <Spinner />
                <span className="text-xs text-slate-400">Thinking…</span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Follow-up suggestions */}
        {suggestions.length > 0 && !loading && (
          <div className="flex flex-wrap gap-2 border-t border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
            <span className="self-center text-xs text-slate-400">Explore:</span>
            {suggestions.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => send(s)}
                className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100 dark:border-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input area */}
        <div className="border-t border-slate-200 bg-white px-4 py-4 dark:border-slate-700 dark:bg-slate-900 sm:px-6">
          <div className="flex items-end gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              rows={2}
              placeholder="Ask me anything… (Enter to send, Shift+Enter for new line)"
              className="flex-1 resize-none rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              style={{ maxHeight: '160px' }}
            />
            <button
              type="button"
              onClick={() => send()}
              disabled={loading || !input.trim()}
              className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow hover:bg-indigo-700 disabled:opacity-40"
            >
              {loading ? <Spinner /> : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              )}
            </button>
          </div>
          <p className="mt-2 text-center text-xs text-slate-400">
            AI can make mistakes. Verify important information.
          </p>
        </div>
      </div>
    </div>
  )
}
