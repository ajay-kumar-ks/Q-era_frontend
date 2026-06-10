import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trash2, Plus, ChevronDown, ChevronUp, AlertTriangle, CheckCircle } from 'lucide-react'
import api from '../../services/api'

const TYPES = ['mcq', 'true_false', 'short_answer', 'descriptive']
const DIFFICULTIES = ['easy', 'medium', 'hard']
const COUNTS = [1, 2, 3, 5, 10]

function Spinner({ sm }) {
  const s = sm ? 'h-3 w-3' : 'h-4 w-4'
  return (
    <svg className={`${s} animate-spin`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  )
}

const inputCls = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"

// ── Single question card ──
function QuestionCard({ q, index, onRemove, onAddSimilar, topic }) {
  const [expanded, setExpanded] = useState(false)
  const [dupInfo, setDupInfo] = useState(null)   // null = not checked yet
  const [dupLoading, setDupLoading] = useState(false)
  const [addingMore, setAddingMore] = useState(false)

  // Check for duplicates when card mounts
  useEffect(() => {
    let cancelled = false
    async function check() {
      setDupLoading(true)
      try {
        const { data } = await api.post('/ai/check-duplicate', {
          title: q.title,
          description: q.description || null,
        })
        if (!cancelled) setDupInfo(data)
      } catch {
        if (!cancelled) setDupInfo(null)
      } finally {
        if (!cancelled) setDupLoading(false)
      }
    }
    check()
    return () => { cancelled = true }
  }, [q.title, q.description])

  const isDup = dupInfo?.is_duplicate && dupInfo.confidence > 0.75

  return (
    <div className={`rounded-xl border p-3 transition-colors ${
      isDup
        ? 'border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20'
        : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'
    }`}>
      {/* Card header */}
      <div className="flex items-start gap-2">
        <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
          {index + 1}
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100 leading-snug">{q.title}</p>

          {/* Code snippet preview when collapsed */}
          {q.description && !expanded && (
            <pre className="mt-1.5 max-h-14 overflow-hidden rounded-lg bg-slate-900 px-2.5 py-1.5 text-[10px] text-slate-300 font-mono leading-relaxed whitespace-pre-wrap">
              {q.description.length > 150 ? q.description.slice(0, 150) + '…' : q.description}
            </pre>
          )}

          {/* Tags row */}
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
              q.difficulty === 'easy' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' :
              q.difficulty === 'hard' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300' :
              'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
            }`}>{q.difficulty}</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600 dark:bg-slate-700 dark:text-slate-300">{q.type}</span>
            {(q.tags || []).map((t) => (
              <span key={t} className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300">#{t}</span>
            ))}
          </div>

          {/* Duplicate warning */}
          {dupLoading && (
            <div className="mt-1.5 flex items-center gap-1 text-xs text-slate-400">
              <Spinner sm /> Checking for duplicates…
            </div>
          )}
          {!dupLoading && isDup && (
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 rounded-lg bg-amber-100 px-2 py-1.5 dark:bg-amber-900/30">
              <AlertTriangle size={12} className="text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <span className="text-xs font-medium text-amber-800 dark:text-amber-300">
                {Math.round(dupInfo.confidence * 100)}% similar to existing question
                {dupInfo.similar_ids?.length > 0 && (
                  <> — IDs: {dupInfo.similar_ids.join(', ')}</>
                )}
              </span>
              {dupInfo.reason && (
                <span className="text-xs text-amber-700 dark:text-amber-400 italic">"{dupInfo.reason}"</span>
              )}
            </div>
          )}
          {!dupLoading && dupInfo && !isDup && (
            <div className="mt-1.5 flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
              <CheckCircle size={11} /> Unique question
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            title={expanded ? 'Collapse' : 'Expand'}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
          <button
            type="button"
            onClick={() => onRemove(q.id)}
            title="Remove question"
            className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/30 dark:hover:text-rose-400"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="mt-3 space-y-2 border-t border-slate-100 pt-3 dark:border-slate-700">
          {q.description && (
            <pre className="overflow-x-auto rounded-lg bg-slate-900 px-3 py-2 text-xs text-slate-100 whitespace-pre-wrap font-mono">{q.description}</pre>
          )}
          {q.options?.length > 0 && (
            <ul className="space-y-1">
              {q.options.map((opt) => (
                <li key={opt.option_order}
                  className={`flex items-start gap-2 rounded-lg px-2.5 py-1.5 text-xs ${
                    opt.option_text === q.correct_answer
                      ? 'bg-emerald-50 text-emerald-800 font-medium dark:bg-emerald-900/30 dark:text-emerald-300'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <span className="flex-shrink-0 font-medium">{opt.option_order}.</span>
                  <span>{opt.option_text}</span>
                  {opt.option_text === q.correct_answer && (
                    <CheckCircle size={12} className="ml-auto flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
                  )}
                </li>
              ))}
            </ul>
          )}
          {(!q.options?.length) && (
            <div className="rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-900">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Correct answer</p>
              <p className="mt-0.5 text-sm text-slate-800 dark:text-slate-200">{q.correct_answer}</p>
            </div>
          )}
          {q.explanation && (
            <p className="text-xs italic text-slate-500 dark:text-slate-400">{q.explanation}</p>
          )}
        </div>
      )}

      {/* Add similar */}
      <div className="mt-2 flex justify-end">
        <button
          type="button"
          onClick={async () => {
            setAddingMore(true)
            await onAddSimilar(q.type, q.difficulty, topic)
            setAddingMore(false)
          }}
          disabled={addingMore}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 disabled:opacity-40 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-indigo-900/30"
        >
          {addingMore ? <Spinner sm /> : <Plus size={12} />}
          Add similar
        </button>
      </div>
    </div>
  )
}

export default function GenerateQuestionsModal({ isAdmin, onClose, onCreated }) {
  const navigate = useNavigate()

  const [genForm, setGenForm] = useState({ topic: '', type: 'mcq', difficulty: 'medium', count: 3, is_public: true, note: '' })
  const [examForm, setExamForm] = useState(null)
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [creatingExam, setCreatingExam] = useState(false)
  const [error, setError] = useState('')
  const [questions, setQuestions] = useState([])   // list of full question objects
  const [requestSent, setRequestSent] = useState(false)

  const updGen = (f, v) => setGenForm((p) => ({ ...p, [f]: v }))
  const updExam = (f, v) => setExamForm((p) => ({ ...p, [f]: v }))

  const handleGenerate = async () => {
    if (!genForm.topic.trim()) { setError('Please enter a topic.'); return }
    setLoading(true); setError('')
    try {
      const { data } = await api.post('/ai/generate-questions', {
        topic: genForm.topic.trim(), type: genForm.type,
        difficulty: genForm.difficulty, count: genForm.count, is_public: genForm.is_public,
      })
      setQuestions(data.questions)
      onCreated?.(data.created)
      const n = data.questions.length
      setExamForm({
        title: `${genForm.topic} — AI Generated Exam`,
        description: `A ${genForm.difficulty} ${genForm.type} exam covering "${genForm.topic}" with ${n} questions.`,
        duration_minutes: Math.max(10, n * 2),
        marks_per_question: 1,
        is_public: genForm.is_public,
        randomize_order: false, randomize_options: false, secure_mode: false,
        scheduled_at: '', deadline: '',
      })
      setStep(2)
    } catch (err) {
      const s = err.response?.status
      setError(s === 503 ? 'AI quota exceeded. Please wait a few minutes.' : s === 403 ? 'Admin access required.' : err.response?.data?.detail || 'Generation failed.')
    } finally { setLoading(false) }
  }

  const handleRequest = async () => {
    if (!genForm.topic.trim()) { setError('Please enter a topic.'); return }
    setLoading(true); setError('')
    try {
      await api.post('/ai/request-questions', {
        topic: genForm.topic.trim(), type: genForm.type,
        difficulty: genForm.difficulty, count: genForm.count,
        note: genForm.note.trim() || null,
      })
      setRequestSent(true)
    } catch (err) { setError(err.response?.data?.detail || 'Could not send request.') }
    finally { setLoading(false) }
  }

  const removeQuestion = (id) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id))
  }

  const addSimilar = async (type, difficulty, topic) => {
    try {
      const { data } = await api.post('/ai/generate-questions', {
        topic: topic || genForm.topic.trim(),
        type, difficulty, count: 1, is_public: genForm.is_public,
      })
      if (data.questions?.length) {
        setQuestions((prev) => [...prev, ...data.questions])
      }
    } catch { /* silently fail */ }
  }

  const handleCreateExam = async () => {
    if (!examForm.title.trim()) { setError('Exam title is required.'); return }
    if (!questions.length) { setError('Add at least one question.'); return }
    setCreatingExam(true); setError('')
    try {
      const mpq = examForm.marks_per_question || 1
      const { data } = await api.post('/exams/', {
        title: examForm.title.trim(),
        description: examForm.description.trim() || null,
        duration_minutes: Number(examForm.duration_minutes) || 30,
        total_marks: questions.length * mpq,
        is_public: examForm.is_public,
        randomize_order: examForm.randomize_order,
        randomize_options: examForm.randomize_options,
        secure_mode: examForm.secure_mode,
        scheduled_at: examForm.scheduled_at || null,
        deadline: examForm.deadline || null,
        questions: questions.map((q, idx) => ({ question_id: q.id, marks: mpq, question_order: idx + 1 })),
      })
      onClose()
      navigate(`/exams/${data.id}`)
    } catch (err) { setError(err.response?.data?.detail || 'Failed to create exam.') }
    finally { setCreatingExam(false) }
  }

  const resetToStep1 = () => {
    setStep(1); setQuestions([]); setExamForm(null); setError('')
    setGenForm((p) => ({ ...p, topic: '' })); setRequestSent(false)
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-y-auto max-h-[92vh] rounded-2xl bg-white shadow-2xl dark:bg-slate-900">

        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-700 dark:bg-slate-900">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {isAdmin ? (step === 1 ? '✦ Generate Questions with AI' : '✦ Review & Create Exam') : '✦ Request AI Questions'}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {isAdmin
                ? step === 1 ? 'AI generates and saves questions to the question bank.'
                : `${questions.length} question${questions.length !== 1 ? 's' : ''} ready · review, edit, then publish`
                : 'Ask admins to generate questions on a topic.'}
            </p>
          </div>
          {isAdmin && (
            <div className="mr-4 hidden items-center gap-1.5 sm:flex">
              {[1, 2].map((s) => (
                <div key={s} className={`h-2 w-8 rounded-full transition-colors ${s <= step ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`} />
              ))}
            </div>
          )}
          <button type="button" onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">✕</button>
        </div>

        <div className="space-y-4 px-6 py-5">

          {/* ── STEP 1 ── */}
          {step === 1 && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Topic <span className="text-rose-500">*</span></label>
                <input value={genForm.topic} onChange={(e) => updGen('topic', e.target.value)}
                  placeholder="e.g. Newton's Laws, French Revolution, Python loops…"
                  className={`mt-1 ${inputCls}`} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Type', key: 'type', opts: TYPES },
                  { label: 'Difficulty', key: 'difficulty', opts: DIFFICULTIES },
                ].map(({ label, key, opts }) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
                    <select value={genForm[key]} onChange={(e) => updGen(key, e.target.value)} className={`mt-1 ${inputCls}`}>
                      {opts.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Count</label>
                  <select value={genForm.count} onChange={(e) => updGen('count', Number(e.target.value))} className={`mt-1 ${inputCls}`}>
                    {COUNTS.map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>
              {isAdmin && (
                <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <input type="checkbox" checked={genForm.is_public} onChange={(e) => updGen('is_public', e.target.checked)} className="rounded" />
                  Make questions public immediately
                </label>
              )}
              {!isAdmin && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Note to admin <span className="text-xs font-normal text-slate-400">(optional)</span></label>
                  <textarea value={genForm.note} onChange={(e) => updGen('note', e.target.value)} rows={2} maxLength={500}
                    placeholder="Requirements, context, curriculum level…" className={`mt-1 ${inputCls}`} />
                </div>
              )}
              {requestSent && (
                <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                  ✓ Request sent to admins. They'll generate questions on your topic soon.
                </p>
              )}
            </>
          )}

          {/* ── STEP 2 ── */}
          {step === 2 && examForm && (
            <>
              {/* Question list */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    Questions <span className="ml-1 rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">{questions.length}</span>
                  </p>
                  <p className="text-xs text-slate-400">Click ▾ to expand · 🗑 to remove · + Add similar</p>
                </div>
                {questions.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-300 py-6 text-center text-sm text-slate-400 dark:border-slate-700">
                    No questions left. Go back to generate more.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {questions.map((q, i) => (
                      <QuestionCard
                        key={q.id}
                        q={q}
                        index={i}
                        topic={genForm.topic}
                        onRemove={removeQuestion}
                        onAddSimilar={addSimilar}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-slate-100 pt-4 dark:border-slate-800" />

              {/* Exam details */}
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Exam Details</p>
              <p className="text-xs text-indigo-600 dark:text-indigo-400">✦ Pre-filled by AI — edit anything before publishing.</p>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Title <span className="text-rose-500">*</span></label>
                <input value={examForm.title} onChange={(e) => updExam('title', e.target.value)} className={`mt-1 ${inputCls}`} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Description <span className="text-xs font-normal text-slate-400">(optional)</span></label>
                <textarea value={examForm.description} onChange={(e) => updExam('description', e.target.value)} rows={2} className={`mt-1 ${inputCls}`} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Duration (min)</label>
                  <input type="number" min={5} max={300} value={examForm.duration_minutes}
                    onChange={(e) => updExam('duration_minutes', Math.max(5, parseInt(e.target.value) || 30))}
                    className={`mt-1 ${inputCls}`} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Marks per question</label>
                  <input type="number" min={1} max={10} value={examForm.marks_per_question}
                    onChange={(e) => updExam('marks_per_question', Math.max(1, parseInt(e.target.value) || 1))}
                    className={`mt-1 ${inputCls}`} />
                </div>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                Total marks: <strong className="text-slate-700 dark:text-slate-200">{questions.length * (examForm.marks_per_question || 1)}</strong>
                &ensp;·&ensp;Questions: <strong className="text-slate-700 dark:text-slate-200">{questions.length}</strong>
                &ensp;·&ensp;Duration: <strong className="text-slate-700 dark:text-slate-200">{examForm.duration_minutes} min</strong>
              </p>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'is_public', label: 'Public exam' },
                  { key: 'randomize_order', label: 'Randomize order' },
                  { key: 'randomize_options', label: 'Randomize options' },
                  { key: 'secure_mode', label: 'Secure mode' },
                ].map(({ key, label }) => (
                  <label key={key} className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:text-slate-300">
                    <input type="checkbox" checked={examForm[key]} onChange={(e) => updExam(key, e.target.checked)} className="rounded" />
                    {label}
                  </label>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Schedule <span className="text-xs font-normal text-slate-400">(optional)</span></label>
                  <input type="datetime-local" value={examForm.scheduled_at}
                    onChange={(e) => updExam('scheduled_at', e.target.value)} className={`mt-1 ${inputCls}`} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Deadline <span className="text-xs font-normal text-slate-400">(optional)</span></label>
                  <input type="datetime-local" value={examForm.deadline}
                    onChange={(e) => updExam('deadline', e.target.value)} className={`mt-1 ${inputCls}`} />
                </div>
              </div>
            </>
          )}

          {error && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-white px-6 py-4 dark:border-slate-700 dark:bg-slate-900">
          <div>
            {step === 2 && (
              <button type="button" onClick={resetToStep1}
                className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
                ← Back &amp; regenerate
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800">
              Cancel
            </button>
            {step === 1 && !requestSent && (
              <button type="button"
                onClick={isAdmin ? handleGenerate : handleRequest}
                disabled={loading || !genForm.topic.trim()}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-40">
                {loading && <Spinner />}
                {loading
                  ? isAdmin ? 'Generating…' : 'Sending…'
                  : isAdmin ? `Generate ${genForm.count} Question${genForm.count !== 1 ? 's' : ''}` : 'Send Request'}
              </button>
            )}
            {step === 2 && (
              <button type="button" onClick={handleCreateExam}
                disabled={creatingExam || !examForm?.title?.trim() || questions.length === 0}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-40">
                {creatingExam && <Spinner />}
                {creatingExam ? 'Creating…' : 'Create & Publish Exam →'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
