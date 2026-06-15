import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { fetchGroups, getCachedGroups } from '../../services/groups'

const TYPES = ['mcq', 'true_false', 'short_answer', 'descriptive']

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  )
}

export default function GenerateExamModal({ onClose, onCreated }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    topic: '',
    easy: 2, medium: 2, hard: 1,
    types: ['mcq'],
    duration_minutes: 30,
    audience: 'public',
    group_ids: [],
    randomize_order: false,
  })
  const [groups, setGroups] = useState([])
  const [groupsLoading, setGroupsLoading] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setGroupsLoading(true)
      const cached = getCachedGroups()
      if (cached) {
        setGroups(cached)
        setGroupsLoading(false)
        return
      }
      const data = await fetchGroups()
      if (mounted) setGroups(Array.isArray(data) ? data : [])
      setGroupsLoading(false)
    }
    load()
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    // ensure groups are loaded when user chooses Audience -> Groups
    if (form.audience === 'groups' && !groupsLoading && groups.length === 0) {
      setGroupsLoading(true)
      fetchGroups().then((data) => { setGroups(Array.isArray(data) ? data : []); setGroupsLoading(false) })
    }
  }, [form.audience])

  const update = (field, value) => setForm((p) => ({ ...p, [field]: value }))
  const totalFromMix = form.easy + form.medium + form.hard

  const toggleType = (t) => {
    setForm((p) => {
      const has = p.types.includes(t)
      const next = has ? p.types.filter((x) => x !== t) : [...p.types, t]
      return { ...p, types: next.length ? next : [t] }
    })
  }

  const toggleGroup = (id) => {
    setForm((p) => {
      const ids = p.group_ids.includes(id) ? p.group_ids.filter(x => x !== id) : [...p.group_ids, id]
      return { ...p, group_ids: ids }
    })
  }

  const handleGenerate = async () => {
    if (!form.topic.trim()) { setError('Please enter a topic.'); return }
    if (totalFromMix === 0) { setError('Difficulty mix must total at least 1.'); return }
    if (form.audience === 'groups' && form.group_ids.length === 0) { setError('Select at least one group.'); return }
    setLoading(true); setError(''); setResult(null)
    try {
      const { data } = await api.post('/ai/generate-exam', {
        topic: form.topic.trim(),
        question_count: totalFromMix,
        difficulty_mix: { easy: form.easy, medium: form.medium, hard: form.hard },
        types: form.types,
        duration_minutes: form.duration_minutes,
        is_public: form.audience === 'public',
        randomize_order: form.randomize_order,
        audience: form.audience,
        group_ids: form.audience === 'groups' ? form.group_ids : [],
      })
      setResult(data)
      onCreated?.(data)
    } catch (err) {
      const s = err.response?.status
      setError(s === 503 ? 'AI quota exceeded. Please wait a minute and try again.'
        : s === 403 ? 'Admin access required.'
        : err.response?.data?.detail || 'Generation failed. Please try again.')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl overflow-y-auto max-h-[92vh] rounded-2xl bg-white shadow-2xl dark:bg-slate-900">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-700">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">✦ Generate Full Exam with AI</h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">AI generates all questions and creates the exam in one step.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">✕</button>
        </div>

        <div className="space-y-5 px-6 py-5">

          {/* Topic */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Topic <span className="text-rose-500">*</span></label>
            <input value={form.topic} onChange={(e) => update('topic', e.target.value)}
              placeholder="e.g. Newton's Laws, World War II, Python Data Structures…"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100" />
          </div>

          {/* Difficulty mix */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Difficulty mix
              <span className="ml-2 text-xs font-normal text-slate-400">Total: {totalFromMix} question{totalFromMix !== 1 ? 's' : ''}</span>
            </label>
            <div className="mt-2 grid grid-cols-3 gap-3">
              {[{ key: 'easy', color: 'emerald', label: 'Easy' }, { key: 'medium', color: 'amber', label: 'Medium' }, { key: 'hard', color: 'rose', label: 'Hard' }].map(({ key, color, label }) => (
                <div key={key} className={`rounded-xl border border-${color}-200 bg-${color}-50 p-3 text-center dark:border-${color}-800 dark:bg-${color}-900/20`}>
                  <p className={`text-xs font-semibold text-${color}-700 dark:text-${color}-300`}>{label}</p>
                  <input type="number" min={0} max={20} value={form[key]}
                    onChange={(e) => update(key, Math.max(0, parseInt(e.target.value) || 0))}
                    className={`mt-1 w-full rounded-lg border border-${color}-200 bg-white px-2 py-1.5 text-center text-sm font-semibold dark:border-${color}-700 dark:bg-slate-800 dark:text-slate-100`} />
                </div>
              ))}
            </div>
          </div>

          {/* Question types */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Question types</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {TYPES.map((t) => (
                <button key={t} type="button" onClick={() => toggleType(t)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${form.types.includes(t) ? 'bg-indigo-600 text-white' : 'border border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Duration + randomize */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Duration (minutes)</label>
              <input type="number" min={5} max={180} value={form.duration_minutes}
                onChange={(e) => update('duration_minutes', Math.max(5, parseInt(e.target.value) || 30))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100" />
            </div>
            <div className="flex flex-col justify-end pb-0.5">
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <input type="checkbox" checked={form.randomize_order} onChange={(e) => update('randomize_order', e.target.checked)} />
                Randomize order
              </label>
            </div>
          </div>

          {/* Audience */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Audience</label>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {[
                { value: 'public',  label: '🌐 Public',  desc: 'All students' },
                { value: 'private', label: '🔒 Private', desc: 'Only you' },
                { value: 'groups',  label: '👥 Groups',  desc: 'Specific groups' },
              ].map(opt => (
                <button key={opt.value} type="button" onClick={() => update('audience', opt.value)}
                  className={`flex flex-col rounded-xl border px-4 py-2.5 text-left text-xs transition ${
                    form.audience === opt.value
                      ? 'border-indigo-400 bg-indigo-50 text-indigo-700 dark:border-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300'
                      : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300'
                  }`}>
                  <span className="font-semibold">{opt.label}</span>
                  <span className="opacity-60">{opt.desc}</span>
                </button>
              ))}
            </div>

            {form.audience === 'groups' && (
              <div className="mt-2">
                {groupsLoading
                  ? <p className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400"><span className="h-4 w-4"><Spinner /></span> Loading groups…</p>
                  : groups.length === 0
                    ? <p className="text-xs text-amber-600 dark:text-amber-400">No groups found. Go to Admin → Student Groups to create groups first.</p>
                    : <div className="flex flex-wrap gap-1.5">
                        {groups.map(g => (
                          <button key={g.id} type="button" onClick={() => toggleGroup(g.id)}
                            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition ${
                              form.group_ids.includes(g.id) ? 'border-transparent text-white' : 'border-slate-300 bg-white text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                            style={form.group_ids.includes(g.id) ? { backgroundColor: g.color } : {}}>
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: form.group_ids.includes(g.id) ? 'rgba(255,255,255,0.5)' : g.color }} />
                            {g.name} ({g.member_count})
                          </button>
                        ))}
                      </div>
                }
                {form.group_ids.length === 0 && <p className="mt-1 text-xs text-rose-500">Select at least one group.</p>}
              </div>
            )}
          </div>

          {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">{error}</p>}

          {result && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-900/20">
              <p className="font-semibold text-emerald-800 dark:text-emerald-300">✓ Exam created — {result.question_count} questions</p>
              <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">{result.title}</p>
              {result.description && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{result.description}</p>}
              <div className="mt-2 flex flex-wrap gap-2">
                {result.questions?.map((q) => (
                  <span key={q.question_id} className={`rounded-full px-2.5 py-1 text-xs font-medium ${q.difficulty === 'easy' ? 'bg-emerald-100 text-emerald-700' : q.difficulty === 'hard' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                    {q.difficulty} · {q.type}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-slate-200 px-6 py-4 dark:border-slate-700">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300">
            {result ? 'Close' : 'Cancel'}
          </button>
          {result ? (
            <>
              <button type="button" onClick={() => navigate(`/exams/${result.id}`)} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">View Exam →</button>
              <button type="button" onClick={() => { setResult(null); update('topic', '') }} className="rounded-lg border border-indigo-300 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 dark:border-indigo-700 dark:text-indigo-300">Generate Another</button>
            </>
          ) : (
            <button type="button" onClick={handleGenerate} disabled={loading || !form.topic.trim() || totalFromMix === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-40">
              {loading && <Spinner />}
              {loading ? 'Generating exam…' : `Generate ${totalFromMix}-Question Exam`}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

