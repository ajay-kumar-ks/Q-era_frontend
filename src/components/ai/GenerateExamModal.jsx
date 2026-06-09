import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'

const TYPES = ['mcq', 'true_false', 'short_answer', 'descriptive']

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  )
}

/**
 * GenerateExamModal — admin-only modal for Phase 2.2
 * Props:
 *  - onClose: fn
 *  - onCreated: fn(exam) called after successful generation
 */
export default function GenerateExamModal({ onClose, onCreated }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    topic: '',
    question_count: 5,
    easy: 2,
    medium: 2,
    hard: 1,
    types: ['mcq'],
    duration_minutes: 30,
    is_public: true,
    randomize_order: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  const update = (field, value) => setForm((p) => ({ ...p, [field]: value }))

  const totalFromMix = form.easy + form.medium + form.hard

  const toggleType = (t) => {
    setForm((p) => {
      const has = p.types.includes(t)
      const next = has ? p.types.filter((x) => x !== t) : [...p.types, t]
      return { ...p, types: next.length ? next : [t] }
    })
  }

  const handleGenerate = async () => {
    if (!form.topic.trim()) { setError('Please enter a topic.'); return }
    if (totalFromMix === 0) { setError('Difficulty mix must total at least 1.'); return }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const { data } = await api.post('/ai/generate-exam', {
        topic: form.topic.trim(),
        question_count: totalFromMix,  // use mix total as authoritative count
        difficulty_mix: { easy: form.easy, medium: form.medium, hard: form.hard },
        types: form.types,
        duration_minutes: form.duration_minutes,
        is_public: form.is_public,
        randomize_order: form.randomize_order,
      })
      setResult(data)
      onCreated?.(data)
    } catch (err) {
      const detail = err.response?.data?.detail
      if (err.response?.status === 503) {
        setError('AI quota exceeded. Please wait a minute and try again.')
      } else if (err.response?.status === 403) {
        setError('Admin access required.')
      } else {
        setError(detail || 'Generation failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl overflow-y-auto max-h-[92vh] rounded-2xl bg-white shadow-2xl dark:bg-slate-900">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-700">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">✦ Generate Full Exam with AI</h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              AI generates all questions, saves them, and creates the exam in one step.
            </p>
          </div>
          <button type="button" onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">✕</button>
        </div>

        <div className="space-y-5 px-6 py-5">

          {/* Topic */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Topic <span className="text-rose-500">*</span>
            </label>
            <input
              value={form.topic}
              onChange={(e) => update('topic', e.target.value)}
              placeholder="e.g. Newton's Laws, World War II, Python Data Structures…"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          {/* Difficulty Mix */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Difficulty mix
              <span className="ml-2 text-xs font-normal text-slate-400">
                Total: {totalFromMix} question{totalFromMix !== 1 ? 's' : ''}
              </span>
            </label>
            <div className="mt-2 grid grid-cols-3 gap-3">
              {[
                { key: 'easy', color: 'emerald', label: 'Easy' },
                { key: 'medium', color: 'amber', label: 'Medium' },
                { key: 'hard', color: 'rose', label: 'Hard' },
              ].map(({ key, color, label }) => (
                <div key={key} className={`rounded-xl border border-${color}-200 bg-${color}-50 p-3 text-center dark:border-${color}-800 dark:bg-${color}-900/20`}>
                  <p className={`text-xs font-semibold text-${color}-700 dark:text-${color}-300`}>{label}</p>
                  <input
                    type="number"
                    min={0}
                    max={20}
                    value={form[key]}
                    onChange={(e) => update(key, Math.max(0, parseInt(e.target.value) || 0))}
                    className={`mt-1 w-full rounded-lg border border-${color}-200 bg-white px-2 py-1.5 text-center text-sm font-semibold dark:border-${color}-700 dark:bg-slate-800 dark:text-slate-100`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Question Types */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Question types</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleType(t)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    form.types.includes(t)
                      ? 'bg-indigo-600 text-white'
                      : 'border border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Duration (minutes)</label>
              <input
                type="number"
                min={5}
                max={180}
                value={form.duration_minutes}
                onChange={(e) => update('duration_minutes', Math.max(5, parseInt(e.target.value) || 30))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
            <div className="flex flex-col justify-end gap-2 pb-0.5">
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <input type="checkbox" checked={form.is_public} onChange={(e) => update('is_public', e.target.checked)} />
                Public exam
              </label>
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <input type="checkbox" checked={form.randomize_order} onChange={(e) => update('randomize_order', e.target.checked)} />
                Randomize question order
              </label>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">{error}</p>
          )}

          {/* Result preview */}
          {result && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-900/20">
              <p className="font-semibold text-emerald-800 dark:text-emerald-300">
                ✓ Exam created — {result.question_count} questions
              </p>
              <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">{result.title}</p>
              {result.description && (
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{result.description}</p>
              )}
              <div className="mt-2 flex flex-wrap gap-2">
                {result.questions.map((q) => (
                  <span
                    key={q.question_id}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      q.difficulty === 'easy' ? 'bg-emerald-100 text-emerald-700' :
                      q.difficulty === 'hard' ? 'bg-rose-100 text-rose-700' :
                      'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {q.difficulty} · {q.type}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-slate-200 px-6 py-4 dark:border-slate-700">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300"
          >
            {result ? 'Close' : 'Cancel'}
          </button>

          {result ? (
            <button
              type="button"
              onClick={() => navigate(`/exams/${result.id}`)}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              View Exam →
            </button>
          ) : (
            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading || !form.topic.trim() || totalFromMix === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-40"
            >
              {loading && <Spinner />}
              {loading ? 'Generating exam…' : `Generate ${totalFromMix}-Question Exam`}
            </button>
          )}

          {result && (
            <button
              type="button"
              onClick={() => { setResult(null); setForm((p) => ({ ...p, topic: '' })) }}
              className="rounded-lg border border-indigo-300 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 dark:border-indigo-700 dark:text-indigo-300"
            >
              Generate Another
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
