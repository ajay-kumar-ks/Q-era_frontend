import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import Loader from '../../components/common/Loader'
import { getStoredUser } from '../../services/api'
import GenerateExamModal from '../../components/ai/GenerateExamModal'

export default function ExamsPage() {
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importMessage, setImportMessage] = useState('')
  const [showAIModal, setShowAIModal] = useState(false)

  const currentUser = getStoredUser()
  const isAdmin = currentUser?.role === 'admin'

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError('')
      try {
        const { data } = await api.get('/exams/', { params: { page: 1, limit: 50 } })
        if (!cancelled) {
          setExams(data || [])
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.detail || 'Failed to load exams.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const filteredExams = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return exams
    return exams.filter((exam) => exam.title.toLowerCase().includes(term) || (exam.description || '').toLowerCase().includes(term))
  }, [exams, search])

  const handleExport = async () => {
    setExporting(true)
    setImportMessage('')
    try {
      const { data } = await api.get('/exams/export')
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `qera-exams-${Date.now()}.json`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      setImportMessage(err.response?.data?.detail || 'Unable to export exams.')
    } finally {
      setExporting(false)
    }
  }

  const handleImport = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setImporting(true)
    setImportMessage('')
    try {
      const text = await file.text()
      const payload = JSON.parse(text)
      await api.post('/exams/import', payload)
      setImportMessage('Exam import completed successfully.')
      const { data } = await api.get('/exams/', { params: { page: 1, limit: 50 } })
      setExams(data || [])
    } catch (err) {
      setImportMessage(err.response?.data?.detail || 'Unable to import exams. Ensure the file is valid JSON with an exams array.')
    } finally {
      setImporting(false)
      event.target.value = ''
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Exams</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">Browse available exams, start a session, or create a new exam.</p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              type="button"
              onClick={() => setShowAIModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
            >
              <span>✦</span> Generate with AI
            </button>
          )}
          <Link
            to="/exams/create"
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Create exam
          </Link>
        </div>
      </div>

      {/* AI Generate Exam Modal */}
      {showAIModal && (
        <GenerateExamModal
          onClose={() => setShowAIModal(false)}
          onCreated={(exam) => {
            setExams((prev) => [exam, ...prev])
          }}
        />
      )}

      <div className="mb-6 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900 md:grid-cols-2">
        <div className="space-y-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search exams by title or description"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-400"
          />
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting}
              className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              {exporting ? 'Exporting…' : 'Export exams'}
            </button>
            <label className="cursor-pointer rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
              {importing ? 'Importing…' : 'Import exams'}
              <input type="file" accept="application/json" onChange={handleImport} className="hidden" />
            </label>
          </div>
          {importMessage && <p className="text-sm text-slate-500 dark:text-slate-400">{importMessage}</p>}
        </div>
        <div className="text-sm text-slate-500 dark:text-slate-400">Showing {filteredExams.length} of {exams.length} exams.</div>
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <Loader />
        </div>
      )}
      {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}
      {!loading && !filteredExams.length && <p className="text-sm text-slate-500 dark:text-slate-400">No exams found.</p>}

      <div className="grid gap-4 md:grid-cols-2">
        {filteredExams.map((exam) => (
          <article key={exam.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Link to={`/exams/${exam.id}`} className="text-xl font-semibold text-slate-900 hover:text-indigo-700 dark:text-slate-100">
                  {exam.title}
                </Link>
                <p className="mt-2 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">{exam.description || 'No description provided.'}</p>
              </div>
              {/* Audience badge */}
              {exam.audience === 'groups' ? (
                <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200">
                  👥 Group
                </span>
              ) : exam.is_public ? (
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200">
                  🌐 Public
                </span>
              ) : (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                  🔒 Private
                </span>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2 text-sm text-slate-600 dark:text-slate-400">
              <span>{exam.questions.length} questions</span>
              <span>· {exam.duration_minutes} min</span>
              <span>· {exam.total_marks} marks</span>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <Link
                to={`/exams/${exam.id}`}
                className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                View details
              </Link>
              <Link
                to={`/exams/${exam.id}/attend`}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Start exam
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
