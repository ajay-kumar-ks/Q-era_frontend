import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'

export default function CreateExamPage() {
  const navigate = useNavigate()
  const [questions, setQuestions] = useState([])
  const [selected, setSelected] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title: '',
    description: '',
    duration_minutes: 20,
    is_public: true,
    randomize_order: false,
    randomize_options: false,
    secure_mode: false,
  })
  const [search, setSearch] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function loadQuestions() {
      setLoading(true)
      setError('')
      try {
        const { data } = await api.get('/questions/', { params: { page: 1, limit: 100 } })
        if (!cancelled) {
          setQuestions(data || [])
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.detail || 'Unable to load questions.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }
    loadQuestions()
    return () => {
      cancelled = true
    }
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
        is_public: form.is_public,
        randomize_order: form.randomize_order,
        randomize_options: form.randomize_options,
        secure_mode: form.secure_mode,
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
          <h1 className="text-3xl font-bold text-slate-900">Create a new exam</h1>
          <p className="mt-2 text-slate-600">Build an exam from your question bank and publish it instantly.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
        <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <label className="text-sm font-semibold text-slate-900">Exam title</label>
            <input
              value={form.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Example: Algebra fundamentals"
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-900">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Describe what this exam covers"
              rows={4}
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-slate-900">Duration (minutes)</label>
              <input
                type="number"
                min="5"
                value={form.duration_minutes}
                onChange={(e) => handleChange('duration_minutes', Number(e.target.value))}
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-900">Total marks</label>
              <div className="mt-2 rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                {totalMarks} points (auto-calculated)
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex items-center gap-3 rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm">
              <input
                type="checkbox"
                checked={form.is_public}
                onChange={(e) => handleChange('is_public', e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600"
              />
              Public exam
            </label>
            <label className="flex items-center gap-3 rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm">
              <input
                type="checkbox"
                checked={form.randomize_order}
                onChange={(e) => handleChange('randomize_order', e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600"
              />
              Randomize question order
            </label>
            <label className="flex items-center gap-3 rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm">
              <input
                type="checkbox"
                checked={form.randomize_options}
                onChange={(e) => handleChange('randomize_options', e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600"
              />
              Randomize question options
            </label>
            <label className="flex items-center gap-3 rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm">
              <input
                type="checkbox"
                checked={form.secure_mode}
                onChange={(e) => handleChange('secure_mode', e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600"
              />
              Secure exam mode
            </label>
          </div>

          <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Selected questions</h2>
              <span className="text-sm text-slate-500">{selected.length} items</span>
            </div>
            {selected.length === 0 ? (
              <p className="text-sm text-slate-600">Select questions from the bank on the right to include them in this exam.</p>
            ) : (
              <div className="space-y-3">
                {selected.map((item) => (
                  <div key={item.question_id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-900">{item.title}</p>
                      <p className="text-sm text-slate-500">Question ID {item.question_id}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="text-sm text-slate-600">Marks</label>
                      <input
                        type="number"
                        min="1"
                        value={item.marks}
                        onChange={(e) => updateMarks(item.question_id, e.target.value)}
                        className="w-20 rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
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
            <p className="text-sm text-slate-500">The exam will be created with the selected questions and marks.</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Question bank</h2>
                <p className="text-sm text-slate-500">Search and pick questions to add to your exam.</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">{questions.length} total</span>
            </div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter questions"
              className="mb-4 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
            {loading && <p className="text-sm text-slate-500">Loading questions...</p>}
            {!loading && !filteredQuestions.length && <p className="text-sm text-slate-500">No questions match your search.</p>}
            <div className="space-y-3">
              {filteredQuestions.map((question) => (
                <div key={question.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-slate-900">{question.title}</p>
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

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Checklist</h2>
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
