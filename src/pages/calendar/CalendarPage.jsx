import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'

export default function CalendarPage() {
  const navigate = useNavigate()
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function fetchUpcomingExams() {
      setLoading(true)
      setError('')
      try {
        const { data } = await api.get('/exams/upcoming', { params: { page: 1, limit: 100 } })
        if (!cancelled) {
          setExams(data || [])
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.detail || 'Unable to load upcoming exams.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchUpcomingExams()

    return () => {
      cancelled = true
    }
  }, [])

  const formatDateTime = (isoString) => {
    if (!isoString) return 'Not specified'
    try {
      const date = new Date(isoString.replace(' ', 'T') + 'Z')
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'UTC',
      })
    } catch {
      return isoString
    }
  }

  const handleStartExam = (examId) => {
    navigate(`/exams/${examId}`)
  }

  if (loading) return <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-slate-500">Loading upcoming exams...</div>
  if (error) return <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-rose-600">{error}</div>

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Exam Calendar</h1>
        <p className="mt-2 text-slate-600">Upcoming exams scheduled for you</p>
      </div>

      {exams.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center">
          <p className="text-sm text-slate-600">No upcoming exams scheduled yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
          {exams.map((exam) => (
            <article key={exam.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">{exam.title}</h2>
                  {exam.description && <p className="mt-1 text-sm text-slate-600">{exam.description}</p>}
                </div>
                {exam.secure_mode && (
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">Secure Mode</span>
                )}
              </div>

              <div className="space-y-2 text-sm text-slate-600 mb-4">
                <div className="flex items-center justify-between">
                  <span>Scheduled for:</span>
                  <span className="font-medium text-slate-900">{formatDateTime(exam.scheduled_at)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Deadline:</span>
                  <span className="font-medium text-slate-900">{formatDateTime(exam.deadline)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Duration:</span>
                  <span className="font-medium text-slate-900">{exam.duration_minutes} minutes</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Total marks:</span>
                  <span className="font-medium text-slate-900">{exam.total_marks}</span>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <button
                  onClick={() => handleStartExam(exam.id)}
                  className="w-full rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  View & Start Exam
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="mt-12 rounded-3xl border border-slate-200 bg-slate-50 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-3">Tips</h2>
        <ul className="space-y-2 text-sm text-slate-600">
          <li>• Check back regularly for new scheduled exams</li>
          <li>• Exams appear here once they are scheduled with a specific date and time</li>
          <li>• Make sure to start before the deadline to avoid missing the exam</li>
          <li>• You can resume exams if you leave and return before the deadline</li>
        </ul>
      </div>
    </div>
  )
}
