import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { fetchGroups } from '../../services/groups'

export default function CreateExamPage() {
  const navigate = useNavigate()
  const [questions, setQuestions] = useState([])
  const [selected, setSelected] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [groups, setGroups] = useState([])
  const [form, setForm] = useState({
    title: '',
    description: '',
    duration_minutes: 20,
    is_public: true,
    audience: 'public',      // 'public' | 'private' | 'groups'
    group_ids: [],
    randomize_order: false,
    randomize_options: false,
    secure_mode: false,
    scheduled_at: '',
    deadline: '',
  })
  const [search, setSearch] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [groupsLoading, setGroupsLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    // Load questions and groups independently — groups show immediately without waiting for questions
    async function loadQuestions() {
      setLoading(true)
      setError('')
      try {
        const { data } = await api.get('/questions/', { params: { page: 1, limit: 100 } })
        if (!cancelled) setQuestions(data || [])
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.detail || 'Unable to load questions.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    async function loadGroups() {
      setGroupsLoading(true)
      try {
        const { data } = await api.get('/exams/groups-for-exam')
        if (!cancelled) setGroups(Array.isArray(data) ? data : [])
      } catch {
        if (!cancelled) setGroups([])
      } finally {
        if (!cancelled) setGroupsLoading(false)
      }
    }
    loadQuestions()
    loadGroups()
    return () => { cancelled = true }
  }, [])

  const addQuestion = (question) => {
    if (selected.some((item) => item.question_id === question.id)) return
    setSelected((prev) => [...prev, { question_id: question.id, title: question.title, marks: 1 }])
  }

  const removeQuestion = (questionId) => {
    setSelected((prev) => prev.filter((item) => item.question_id !== questionId))
  }

  const updateMarks = (questionId, value) => {
    setSelected((prev) =>
      prev.map((item) =>
        item.question_id === questionId ? { ...item, marks: Math.max(1, Number(value) || 1) } : item,
      ),
    )
  }

  const filteredQuestions = useMemo(() => {
    const term = search.trim().toLowerCase()
    return questions.filter((question) => {
      if (!term) return true
      return (
        question.title.toLowerCase().includes(term) ||
        (question.description || '').toLowerCase().includes(term)
      )
    })
  }, [questions, search])

  const totalMarks = selected.reduce((sum, item) => sum + item.marks, 0)

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!form.title.trim()) {
      setError('Exam title is required.')
      return
    }
    if (!selected.length) {
      setError('Please select at least one question.')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      const { data } = await api.post('/exams/', {
        title: form.title,
        description: form.description,
        duration_minutes: Number(form.duration_minutes),
        total_marks: totalMarks,
        is_public: form.audience === 'public',
        audience: form.audience,
        group_ids: form.audience === 'groups' ? form.group_ids : [],
        randomize_order: form.randomize_order,
        randomize_options: form.randomize_options,
        secure_mode: form.secure_mode,
        scheduled_at: form.scheduled_at || null,
        deadline: form.deadline || null,
        questions: selected.map((item, index) => ({
          question_id: item.question_id,
          marks: item.marks,
          question_order: index + 1,
        })),
      })
      navigate(`/exams/${data.id}`)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create exam.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Create a new exam</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">Build an exam from your question bank and publish it instantly.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
        <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div>
            <label className="text-sm font-semibold text-slate-900 dark:text-slate-100">Exam title</label>
            <input
              value={form.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Example: Algebra fundamentals"
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-400"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-900 dark:text-slate-100">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Describe what this exam covers"
              rows={4}
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-400"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-slate-900 dark:text-slate-100">Duration (minutes)</label>
              <input
                type="number"
                min="5"
                value={form.duration_minutes}
                onChange={(e) => handleChange('duration_minutes', Number(e.target.value))}
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-900 dark:text-slate-100">Total marks</label>
              <div className="mt-2 rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {totalMarks} points (auto-calculated)
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Audience selector */}
            <div className="sm:col-span-2">
              <label className="text-sm font-semibold text-slate-900 dark:text-slate-100">Audience</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {[
                  { value: 'public',  label: '🌐 Public',  desc: 'Visible to all students' },
                  { value: 'private', label: '🔒 Private', desc: 'Only you can see it' },
                  { value: 'groups',  label: '👥 Groups',  desc: 'Specific student groups' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleChange('audience', opt.value)}
                    className={`flex flex-col items-start rounded-2xl border px-4 py-3 text-left text-sm transition ${
                      form.audience === opt.value
                        ? 'border-indigo-400 bg-indigo-50 text-indigo-700 dark:border-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300'
                        : 'border-slate-300 bg-slate-50 text-slate-700 hover:border-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    <span className="font-semibold">{opt.label}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{opt.desc}</span>
                  </button>
                ))}
              </div>

              {/* Group picker */}
              {form.audience === 'groups' && (
                <div className="mt-3">
                  {groupsLoading ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400">Loading groups…</p>
                  ) : groups.length === 0 ? (
                    <p className="text-sm text-amber-600 dark:text-amber-400">
                      No groups found. <a href="/admin/groups" className="underline">Create groups first →</a>
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {groups.map(g => (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => {
                            const ids = form.group_ids.includes(g.id)
                              ? form.group_ids.filter(id => id !== g.id)
                              : [...form.group_ids, g.id]
                            handleChange('group_ids', ids)
                          }}
                          className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition ${
                            form.group_ids.includes(g.id)
                              ? 'border-transparent text-white'
                              : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                          style={form.group_ids.includes(g.id) ? { backgroundColor: g.color } : {}}
                        >
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: form.group_ids.includes(g.id) ? 'rgba(255,255,255,0.6)' : g.color }} />
                          {g.name}
                          <span className="opacity-60">({g.member_count})</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {form.audience === 'groups' && form.group_ids.length === 0 && (
                    <p className="mt-1 text-xs text-rose-500">Select at least one group.</p>
                  )}
                </div>
              )}
            </div>

            <label className="flex items-center gap-3 rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <input type="checkbox" checked={form.randomize_order} onChange={(e) => handleChange('randomize_order', e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-indigo-600" />
              Randomize question order
            </label>
            <label className="flex items-center gap-3 rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <input type="checkbox" checked={form.randomize_options} onChange={(e) => handleChange('randomize_options', e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-indigo-600" />
              Randomize question options
            </label>
            <label className="flex items-center gap-3 rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <input type="checkbox" checked={form.secure_mode} onChange={(e) => handleChange('secure_mode', e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-indigo-600" />
              Secure exam mode
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-slate-900 dark:text-slate-100">Schedule exam (optional)</label>
              <input
                type="datetime-local"
                value={form.scheduled_at}
                onChange={(e) => handleChange('scheduled_at', e.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">When this exam becomes available</p>
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-900 dark:text-slate-100">Deadline (optional)</label>
              <input
                type="datetime-local"
                value={form.deadline}
                onChange={(e) => handleChange('deadline', e.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">When students must complete it</p>
            </div>
          </div>

          <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Selected questions</h2>
              <span className="text-sm text-slate-500 dark:text-slate-400">{selected.length} items</span>
            </div>
            {selected.length === 0 ? (
              <p className="text-sm text-slate-600 dark:text-slate-400">Select questions from the bank on the right to include them in this exam.</p>
            ) : (
              <div className="space-y-3">
                {selected.map((item) => (
                  <div key={item.question_id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-900 dark:text-slate-100">{item.title}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Question ID {item.question_id}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="text-sm text-slate-600 dark:text-slate-400">Marks</label>
                      <input
                        type="number"
                        min="1"
                        value={item.marks}
                        onChange={(e) => updateMarks(item.question_id, e.target.value)}
                        className="w-20 rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                      />
                      <button
                        type="button"
                        onClick={() => removeQuestion(item.question_id)}
                        className="text-sm font-semibold text-rose-600 hover:text-rose-700"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && <p className="text-sm text-rose-600">{error}</p>}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Create exam
            </button>
            <p className="text-sm text-slate-500 dark:text-slate-400">The exam will be created with the selected questions and marks.</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Question bank</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Search and pick questions to add to your exam.</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">{questions.length} total</span>
            </div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter questions"
              className="mb-4 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            />
            {loading && <p className="text-sm text-slate-500 dark:text-slate-400">Loading questions...</p>}
            {!loading && !filteredQuestions.length && <p className="text-sm text-slate-500 dark:text-slate-400">No questions match your search.</p>}
            <div className="space-y-3">
              {filteredQuestions.map((question) => (
                <div key={question.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">{question.title}</p>
                      <p className="mt-1 text-sm text-slate-500">{question.type} · {question.difficulty}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => addQuestion(question)}
                      disabled={selected.some((item) => item.question_id === question.id)}
                      className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {selected.some((item) => item.question_id === question.id) ? 'Added' : 'Add'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Checklist</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li>Choose at least one question.</li>
              <li>Set realistic mark values for each question.</li>
              <li>Public exams are visible to all authenticated users.</li>
            </ul>
          </div>
        </div>
      </form>
    </div>
  )
}




