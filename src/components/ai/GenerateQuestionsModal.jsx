import { useState } from 'react'
import api from '../../services/api'

const TYPES = ['mcq', 'true_false', 'short_answer', 'descriptive']
const DIFFICULTIES = ['easy', 'medium', 'hard']
const COUNTS = [1, 2, 3, 5, 10]

// Spinner icon
function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  )
}

/**
 * GenerateQuestionsModal
 *
 * Props:
 *  - isAdmin: bool        — if true shows "Generate & Save" button, else shows "Request from Admin"
 *  - onClose: fn          — close the modal
 *  - onCreated: fn(count) — called after admin successfully generates questions
 */
export default function GenerateQuestionsModal({ isAdmin, onClose, onCreated }) {
  const [form, setForm] = useState({
    topic: '',
    type: 'mcq',
    difficulty: 'medium',
    count: 3,
    is_public: true,
    note: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [preview, setPreview] = useState(null) // generated questions before saving (admin flow shows results inline)

  const update = (field, value) => setForm((p) => ({ ...p, [field]: value }))

  const handleGenerate = async () => {
    if (!form.topic.trim()) {
      setError('Please enter a topic.')
      return
    }
    setLoading(true)
    setError('')
    setSuccess('')
    setPreview(null)

    try {
      const { data } = await api.post('/ai/generate-questions', {
        topic: form.topic.trim(),
        type: form.type,
        difficulty: form.difficulty,
        count: form.count,
        is_public: form.is_public,
      })
      setPreview(data.questions)
      setSuccess(`✓ ${data.created} question${data.created !== 1 ? 's' : ''} generated and saved successfully.`)
      onCreated?.(data.created)
    } catch (err) {
      const detail = err.response?.data?.detail
      if (err.response?.status === 503) {
        setError('AI quota exceeded on all models. Please wait a few minutes and try again, or add more API keys.')
      } else if (err.response?.status === 403) {
        setError('Admin access required.')
      } else {
        setError(detail || 'Generation failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRequest = async () => {
    if (!form.topic.trim()) {
      setError('Please enter a topic.')
      return
    }
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const { data } = await api.post('/ai/request-questions', {
        topic: form.topic.trim(),
        type: form.type,
        difficulty: form.difficulty,
        count: form.count,
        note: form.note.trim() || null,
      })
      setSuccess(data.message)
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not send request. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl dark:bg-slate-900 overflow-y-auto max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-700">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {isAdmin ? '✦ Generate Questions with AI' : '✦ Request AI Questions'}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {isAdmin
                ? 'AI will generate and save questions directly to the question bank.'
                : 'Send a request to admins to generate questions on a topic using AI.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4 px-6 py-5">

          {/* Topic */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Topic <span className="text-rose-500">*</span>
            </label>
            <input
              value={form.topic}
              onChange={(e) => update('topic', e.target.value)}
              placeholder="e.g. Newton's Laws of Motion, French Revolution, Python loops…"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          {/* Type + Difficulty + Count */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Type</label>
              <select
                value={form.type}
                onChange={(e) => update('type', e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              >
                {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Difficulty</label>
              <select
                value={form.difficulty}
                onChange={(e) => update('difficulty', e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              >
                {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Count</label>
              <select
                value={form.count}
                onChange={(e) => update('count', Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              >
                {COUNTS.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>

          {/* is_public toggle (admin only) */}
          {isAdmin && (
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={form.is_public}
                onChange={(e) => update('is_public', e.target.checked)}
                className="rounded"
              />
              Make questions public immediately
            </label>
          )}

          {/* Note (user request only) */}
          {!isAdmin && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Note to admin <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={form.note}
                onChange={(e) => update('note', e.target.value)}
                rows={2}
                maxLength={500}
                placeholder="Any specific requirements, context, or curriculum level…"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          )}

          {/* Error / Success */}
          {error && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">
              {error}
            </p>
          )}
          {success && (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
              {success}
            </p>
          )}

          {/* Preview of generated questions (admin) */}
          {preview && preview.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Generated Questions
              </p>
              {preview.map((q, i) => (
                <div key={i} className="rounded-xl border border-indigo-100 bg-indigo-50 p-4 dark:border-indigo-800 dark:bg-indigo-900/20">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {i + 1}. {q.title}
                  </p>
                  {q.description && (
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{q.description}</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-700 dark:bg-indigo-800 dark:text-indigo-200">
                      {q.difficulty}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {q.type}
                    </span>
                    {q.tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200">
                        #{tag}
                      </span>
                    ))}
                  </div>
                  {q.options.length > 0 && (
                    <ul className="mt-2 space-y-0.5">
                      {q.options.map((opt) => (
                        <li key={opt.option_order} className="text-xs text-slate-600 dark:text-slate-400">
                          {opt.option_order}. {opt.option_text}
                          {opt.option_text === q.correct_answer && (
                            <span className="ml-1 text-emerald-600">✓</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-medium text-slate-700 dark:text-slate-300">Answer:</span> {q.correct_answer}
                  </p>
                  {q.explanation && (
                    <p className="mt-1 text-xs italic text-slate-500 dark:text-slate-400">{q.explanation}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-slate-200 px-6 py-4 dark:border-slate-700">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {success ? 'Close' : 'Cancel'}
          </button>

          {!success && (
            <button
              type="button"
              onClick={isAdmin ? handleGenerate : handleRequest}
              disabled={loading || !form.topic.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-40"
            >
              {loading && <Spinner />}
              {loading
                ? isAdmin ? 'Generating…' : 'Sending…'
                : isAdmin ? `Generate ${form.count} Question${form.count !== 1 ? 's' : ''}` : 'Send Request'}
            </button>
          )}

          {/* After success, admin can generate more */}
          {success && isAdmin && (
            <button
              type="button"
              onClick={() => { setSuccess(''); setPreview(null); setForm((p) => ({ ...p, topic: '' })) }}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Generate More
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
