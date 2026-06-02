import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api from '../../services/api'

const attemptStorageKey = (examId) => `qera_exam_attempt_${examId}`

function parseServerTime(value) {
  if (!value) return Date.now()
  const text = String(value)
  const normalized = text.includes('T') ? text : `${text.replace(' ', 'T')}Z`
  const parsed = new Date(normalized).getTime()
  return Number.isNaN(parsed) ? Date.now() : parsed
}

export default function ExamDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [exam, setExam] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [starting, setStarting] = useState(false)
  const [attempt, setAttempt] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError('')
      setAttempt(null)
      try {
        const { data } = await api.get(`/exams/${id}`)
        if (cancelled) return
        setExam(data)
        try {
          const attemptResponse = await api.get(`/exams/${id}/attempt/latest`)
          if (!cancelled) {
            const active = {
              attemptId: attemptResponse.data.id,
              attemptNumber: attemptResponse.data.attempt_number,
              startedAt: parseServerTime(attemptResponse.data.started_at),
              durationMinutes: data.duration_minutes,
              questions: attemptResponse.data.questions || [],
            }
            setAttempt(active)
            saveAttempt(active)
          }
        } catch (err) {
          if (err.response?.status !== 404 && err.response?.status !== 401 && err.response?.status !== 403) {
            throw err
          }
          const stored = storedAttempt()
          if (!cancelled && stored?.examId === Number(id)) {
            setAttempt(stored)
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.detail || 'Failed to load exam.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [id])

  const storedAttempt = () => {
    try {
      const raw = localStorage.getItem(attemptStorageKey(id))
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }

  const saveAttempt = (attemptData) => {
    try {
      localStorage.setItem(attemptStorageKey(id), JSON.stringify(attemptData))
    } catch {
      // ignore storage failures
    }
  }

  const clearAttempt = () => {
    try {
      localStorage.removeItem(attemptStorageKey(id))
    } catch {
      // ignore storage failures
    }
  }

  const startExam = async () => {
    if (!exam) return
    setStarting(true)
    try {
      const { data } = await api.post(`/exams/${id}/start`)
      const payload = {
        attemptId: data.id,
        examId: Number(id),
        attemptNumber: data.attempt_number,
        startedAt: parseServerTime(data.started_at),
        durationMinutes: exam.duration_minutes,
        questions: data.questions || [],
      }
      saveAttempt(payload)
      navigate(`/exams/${id}/attend`)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to start exam.')
    } finally {
      setStarting(false)
    }
  }

  const resumeExam = () => {
    navigate(`/exams/${id}/attend`)
  }

  if (loading) return <div className="mx-auto max-w-4xl px-4 py-8 text-sm text-slate-500">Loading exam details...</div>
  if (error) return <div className="mx-auto max-w-4xl px-4 py-8 text-sm text-rose-600">{error}</div>
  if (!exam) return null

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{exam.title}</h1>
            <p className="mt-3 text-slate-600">{exam.description || 'No description provided.'}</p>
          </div>
          <div className="space-y-2 text-right text-sm text-slate-500">
            <div>{exam.questions.length || (exam.secure_mode ? 'Hidden' : 0)} questions</div>
            <div>{exam.duration_minutes} minutes</div>
            <div>{exam.total_marks} total marks</div>
            <div>{exam.is_public ? 'Public exam' : 'Private exam'}</div>
            {exam.randomize_options ? <div>Options randomized</div> : null}
            {exam.secure_mode ? <div>Secure mode enabled</div> : null}
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <h2 className="text-lg font-semibold text-slate-900">Exam content</h2>
            <p className="mt-3 text-sm text-slate-600">
              {exam.secure_mode ? 'This exam is in secure mode. Question previews are hidden until you start the attempt.' : 'This exam includes the questions listed below. When you start, the timer begins immediately.'}
            </p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <h2 className="text-lg font-semibold text-slate-900">Your progress</h2>
            {attempt ? (
              <p className="mt-3 text-sm text-slate-600">You have an active attempt #{attempt.attemptNumber}. Resume it or start again to create a fresh attempt.</p>
            ) : (
              <p className="mt-3 text-sm text-slate-600">No active attempt found. Starting will lock in your timer and save your progress in browser session storage.</p>
            )}
            <p className="mt-4 text-sm text-slate-500">After your first submission, results will appear and the leaderboard will update.</p>
            <Link
              to={`/leaderboard/exam/${exam.id}`}
              className="mt-4 inline-flex rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
            >
              View exam leaderboard
            </Link>
          </div>
        </div>

        <div className="mt-8 space-y-3">
          {exam.questions.map((question) => (
            <div key={question.question_id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-900">{question.title}</p>
                  <p className="text-sm text-slate-500">{question.type} · {question.difficulty}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">{question.marks} pts</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          {attempt ? (
            <button
              type="button"
              onClick={resumeExam}
              className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Resume exam
            </button>
          ) : null}
          <button
            type="button"
            onClick={startExam}
            disabled={starting}
            className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {attempt ? 'Restart attempt' : 'Start exam'}
          </button>
        </div>
      </div>
    </div>
  )
}
