import { useState } from 'react'
import api from '../../services/api'

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  )
}

/**
 * AIExplanation — inline "Ask AI to explain" button + expandable panel.
 *
 * Props:
 *  questionId   int     — required
 *  userAnswer   string  — what the user answered (optional)
 *  isCorrect    bool    — whether they got it right (optional)
 *  compact      bool    — smaller button style (for use inside result cards)
 */
export default function AIExplanation({ questionId, userAnswer, isCorrect, compact = false }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  const fetch = async () => {
    if (data) { setOpen((v) => !v); return }
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/ai/explain', {
        question_id: questionId,
        user_answer: userAnswer ?? null,
        is_correct: isCorrect ?? null,
      })
      setData(res.data)
      setOpen(true)
    } catch (err) {
      setError(err.response?.data?.detail || 'AI explanation unavailable. Please try again.')
      setOpen(true)
    } finally {
      setLoading(false)
    }
  }

  const btnBase = compact
    ? 'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors'
    : 'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors'

  const btnColor = open
    ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-300'
    : 'bg-indigo-600 text-white hover:bg-indigo-700'

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={fetch}
        disabled={loading}
        className={`${btnBase} ${btnColor} disabled:opacity-50`}
      >
        {loading ? <Spinner /> : <span>✦</span>}
        {loading ? 'Getting explanation…' : open ? 'Hide AI explanation' : 'Ask AI to explain'}
      </button>

      {open && (
        <div className="mt-3 rounded-2xl border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-800 dark:bg-indigo-900/20">
          {error ? (
            <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>
          ) : data ? (
            <div className="space-y-3">
              {/* Verdict badge */}
              {isCorrect !== null && isCorrect !== undefined && (
                <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  isCorrect
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                    : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
                }`}>
                  {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                </span>
              )}

              {/* Explanation */}
              <p className="text-sm leading-relaxed text-slate-800 dark:text-slate-200">
                {data.explanation}
              </p>

              {/* Key concept */}
              {data.key_concept && (
                <div className="flex items-start gap-2 rounded-xl bg-white px-3 py-2.5 shadow-sm dark:bg-slate-800">
                  <span className="mt-0.5 text-indigo-500">🔑</span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Key concept</p>
                    <p className="mt-0.5 text-sm font-medium text-slate-800 dark:text-slate-200">{data.key_concept}</p>
                  </div>
                </div>
              )}

              {/* Study suggestion */}
              {data.suggestion && (
                <div className="flex items-start gap-2 rounded-xl bg-white px-3 py-2.5 shadow-sm dark:bg-slate-800">
                  <span className="mt-0.5 text-amber-500">📚</span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Study tip</p>
                    <p className="mt-0.5 text-sm text-slate-700 dark:text-slate-300">{data.suggestion}</p>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
