import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../services/api'

const attemptStorageKey = (examId) => `qera_exam_attempt_${examId}`

function parseServerTime(value) {
  if (!value) return Date.now()
  const text = String(value)
  const normalized = text.includes('T') ? text : `${text.replace(' ', 'T')}Z`
  const parsed = new Date(normalized).getTime()
  return Number.isNaN(parsed) ? Date.now() : parsed
}

function formatTimer(seconds) {
  const mins = String(Math.floor(seconds / 60)).padStart(2, '0')
  const secs = String(seconds % 60).padStart(2, '0')
  return `${mins}:${secs}`
}

function shuffleOptions(options = []) {
  const shuffled = [...options]
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export default function AttendExamPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [exam, setExam] = useState(null)
  const [questions, setQuestions] = useState([])
  const [attempt, setAttempt] = useState(null)
  const [answers, setAnswers] = useState({})
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [autoSubmitArmed, setAutoSubmitArmed] = useState(false)
  const submittingRef = useRef(false)

  const storageKey = attemptStorageKey(id)

  const getStoredAttempt = () => {
    try {
      const raw = localStorage.getItem(storageKey)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }

  const saveStoredAttempt = (value) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(value))
    } catch {
      // ignore storage failures
    }
  }

  const clearStoredAttempt = () => {
    try {
      localStorage.removeItem(storageKey)
    } catch {
      // ignore storage failures
    }
  }

  useEffect(() => {
    let cancelled = false
    let interval = null

    async function bootstrap() {
      setLoading(true)
      setError('')
      try {
        setAutoSubmitArmed(false)
        const examRes = await api.get(`/exams/${id}`)
        if (cancelled) return

        const examData = examRes.data
        setExam(examData)

        let currentAttempt = getStoredAttempt()
        let attemptResponse = null
        if (currentAttempt?.examId === Number(id)) {
          setAttempt(currentAttempt)
          setAnswers(currentAttempt.answers || {})
        }

        try {
          attemptResponse = await api.get(`/exams/${id}/attempt/latest`)
        } catch (err) {
          if (err.response?.status !== 404) {
            throw err
          }
        }

        if (attemptResponse?.data) {
          const serverRaw = attemptResponse.data
          const serverAttempt = {
            attemptId: serverRaw.id,
            examId: Number(id),
            attemptNumber: serverRaw.attempt_number,
            startedAt: parseServerTime(serverRaw.started_at),
            durationMinutes: examData.duration_minutes,
            answers: serverRaw.answers || {},
            questions: serverRaw.questions || [],
            last_saved_at: serverRaw.last_saved_at || null,
          }

          // If we had a local stored attempt, prefer the one with the newest last_saved_at
          const localAttempt = getStoredAttempt()
          const localSaved = localAttempt?.last_saved_at ? parseServerTime(localAttempt.last_saved_at) : 0
          const serverSaved = serverAttempt.last_saved_at ? parseServerTime(serverAttempt.last_saved_at) : 0

          if (localAttempt && localAttempt.examId === Number(id) && localSaved > serverSaved) {
            // local is newer — try to persist it to server, otherwise keep local
            try {
              const res = await api.patch(`/exams/attempt/${localAttempt.attemptId}`, {
                time_taken_seconds: Math.max(0, Math.floor((Date.now() - localAttempt.startedAt) / 1000)),
                answers: Object.fromEntries(Object.entries(localAttempt.answers || {}).map(([q, a]) => [String(q), a?.toString() || ''])),
              })
              if (res?.data) {
                const merged = {
                  attemptId: res.data.id,
                  examId: Number(id),
                  attemptNumber: res.data.attempt_number,
                  startedAt: parseServerTime(res.data.started_at),
                  durationMinutes: examData.duration_minutes,
                  answers: res.data.answers || {},
                  questions: res.data.questions || [],
                  last_saved_at: res.data.last_saved_at || null,
                }
                currentAttempt = merged
                setAttempt(merged)
                setAnswers(merged.answers)
                saveStoredAttempt(merged)
              } else {
                // fallback to local
                currentAttempt = localAttempt
                setAttempt(localAttempt)
                setAnswers(localAttempt.answers || {})
                saveStoredAttempt(localAttempt)
              }
            } catch (e) {
              // server save failed; keep local attempt so user doesn't lose work
              currentAttempt = localAttempt
              setAttempt(localAttempt)
              setAnswers(localAttempt.answers || {})
              saveStoredAttempt(localAttempt)
            }
          } else {
            // server is newer or no local attempt — use server
            currentAttempt = serverAttempt
            setAttempt(serverAttempt)
            setAnswers(serverAttempt.answers)
            saveStoredAttempt(serverAttempt)
          }
        }

        if (!currentAttempt || currentAttempt.examId !== Number(id)) {
          const { data } = await api.post(`/exams/${id}/start`)
          currentAttempt = {
            attemptId: data.id,
            examId: Number(id),
            attemptNumber: data.attempt_number,
            startedAt: parseServerTime(data.started_at),
            durationMinutes: examData.duration_minutes,
            answers: data.answers || {},
            questions: data.questions || [],
          }
          setAttempt(currentAttempt)
          setAnswers(currentAttempt.answers)
          saveStoredAttempt(currentAttempt)
        }

        const questionSource = currentAttempt.questions?.length ? currentAttempt.questions : examData.questions
        if (!questionSource?.length) {
          setError('Unable to load exam questions.')
          return
        }

        const questionDetails = await Promise.all(
          questionSource.map((item) => api.get(`/questions/${item.question_id}`)),
        )
        if (cancelled) return
        const fetchedQuestions = questionDetails.map((response) => response.data)
        const questionMarks = Object.fromEntries(questionSource.map((item) => [item.question_id, item.marks]))
        setQuestions(
          examData.randomize_options ? fetchedQuestions.map((question) => ({
            ...question,
            marks: questionMarks[question.id] ?? question.marks ?? 1,
            options: shuffleOptions(question.options || []),
          })) : fetchedQuestions.map((question) => ({
            ...question,
            marks: questionMarks[question.id] ?? question.marks ?? 1,
          })),
        )

        // reset question index on new attempt
        setCurrentQuestionIndex(0)

        const elapsed = Math.floor((Date.now() - currentAttempt.startedAt) / 1000)
        const remaining = Math.max(0, examData.duration_minutes * 60 - elapsed)
        setRemainingSeconds(remaining)

        if (remaining <= 0) {
          await handleSubmit(currentAttempt, examData, currentAttempt.answers || {}, clearStoredAttempt, true)
          return
        }

        setAutoSubmitArmed(true)
        interval = setInterval(() => {
          setRemainingSeconds((current) => {
            if (current <= 1) {
              clearInterval(interval)
              return 0
            }
            return current - 1
          })
        }, 1000)
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.detail || 'Unable to load exam session.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    bootstrap()

    return () => {
      cancelled = true
      if (interval) clearInterval(interval)
    }
  }, [id])

  useEffect(() => {
    if (autoSubmitArmed && remainingSeconds === 0 && attempt && exam) {
      setAutoSubmitArmed(false)
      handleSubmit(attempt, exam, answers, clearStoredAttempt, true).catch(() => {})
    }
  }, [autoSubmitArmed, remainingSeconds, attempt, exam, answers])

  const setAnswer = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  // Secure mode: disable right-click and refresh shortcuts to reduce casual cheating
  useEffect(() => {
    if (!exam || !exam.secure_mode) return
    const onContext = (e) => e.preventDefault()
    const onKey = (e) => {
      // block F5 and Ctrl+R
      if (e.key === 'F5' || ((e.ctrlKey || e.metaKey) && (e.key === 'r' || e.key === 'R'))) {
        e.preventDefault()
      }
    }
    window.addEventListener('contextmenu', onContext)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('contextmenu', onContext)
      window.removeEventListener('keydown', onKey)
    }
  }, [exam])

  useEffect(() => {
    if (!attempt || !exam) return
    const timer = setTimeout(async () => {
      try {
        const timeTaken = exam.duration_minutes * 60 - remainingSeconds
        const res = await api.patch(`/exams/attempt/${attempt.attemptId}`, {
          time_taken_seconds: Math.max(0, timeTaken),
          answers: Object.fromEntries(
            Object.entries(answers).map(([question, answer]) => [String(question), answer?.toString() || '']),
          ),
        })
        if (res?.data) {
          const data = res.data
          const updated = {
            attemptId: data.id,
            examId: Number(id),
            attemptNumber: data.attempt_number,
            startedAt: parseServerTime(data.started_at),
            durationMinutes: exam.duration_minutes,
            answers: data.answers || {},
            questions: data.questions || [],
            last_saved_at: data.last_saved_at || null,
          }
          setAttempt(updated)
          saveStoredAttempt(updated)
        } else {
          saveStoredAttempt({ ...attempt, answers })
        }
      } catch {
        // ignore save failures for now
      }
    }, 1200)
    return () => clearTimeout(timer)
  }, [answers, attempt, exam, remainingSeconds])

  const handleSubmit = async (currentAttempt, examData, currentAnswers, clearFn, auto = false) => {
    if (!currentAttempt || !examData) return
    if (submittingRef.current) return
    submittingRef.current = true
    setSaving(true)
    setError('')
    try {
      const timeTaken = examData.duration_minutes * 60 - remainingSeconds
      const { data } = await api.post(`/exams/${id}/submit`, {
        attempt_id: currentAttempt.attemptId,
        time_taken_seconds: timeTaken,
        answers: Object.fromEntries(
          Object.entries(currentAnswers).map(([question, answer]) => [String(question), answer?.toString() || '']),
        ),
      })
      clearFn()
      navigate(`/exams/${id}/result/${data.id}`)
    } catch (err) {
      if (!auto) {
        setError(err.response?.data?.detail || 'Unable to submit exam.')
      }
    } finally {
      submittingRef.current = false
      setSaving(false)
    }
  }

  const handleManualSubmit = async () => {
    if (!window.confirm('Submit your answers and finish the exam?')) return
    if (!attempt) {
      setError('No active attempt found.')
      return
    }
    await handleSubmit(attempt, exam, answers, clearStoredAttempt, false)
  }

  const perQuestion = useMemo(() => {
    if (!questions.length) return []
    return questions
  }, [questions])

  if (loading) return <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-slate-500">Preparing your exam...</div>
  if (error) return <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-rose-600">{error}</div>
  if (!exam || !attempt) return null

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{exam.title}</h1>
          <p className="mt-2 text-slate-600">Attempt #{attempt.attemptNumber}. You have {formatTimer(remainingSeconds)} remaining.</p>
        </div>
        <button
          onClick={handleManualSubmit}
          disabled={saving}
          className="rounded-xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Submit exam
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-6">
          {exam.secure_mode ? (
            // show one question at a time in secure mode and prevent backtracking
            (() => {
              const question = perQuestion[currentQuestionIndex]
              if (!question) return null
              return (
                <article key={question.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold text-slate-900">Q{currentQuestionIndex + 1}. {question.title}</p>
                      <p className="mt-2 text-sm text-slate-500">{question.type} · {question.difficulty}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">{exam.questions[currentQuestionIndex]?.marks ?? 1} pts</span>
                  </div>

                  {question.image_url ? (
                    <img src={question.image_url} alt="" className="mt-4 max-h-80 w-full rounded-xl border border-slate-200 object-contain" />
                  ) : null}
                  {(question.media_url || question.attachment_url) ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {question.media_url ? (
                        <a href={question.media_url} target="_blank" rel="noreferrer" className="rounded-lg bg-indigo-50 px-3 py-1.5 text-sm font-semibold text-indigo-700">Open media</a>
                      ) : null}
                      {question.attachment_url ? (
                        <a href={question.attachment_url} target="_blank" rel="noreferrer" className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700">Open attachment</a>
                      ) : null}
                    </div>
                  ) : null}

                  {question.options?.length ? (
                    <div className="mt-4 space-y-3">
                      {question.options.map((option) => (
                        <label key={option.id} className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                          <input
                            type={question.type === 'mcq' ? 'radio' : 'radio'}
                            name={`question-${question.id}`}
                            value={option.option_text}
                            checked={answers[question.id] === option.option_text}
                            onChange={(e) => setAnswer(question.id, e.target.value)}
                            className="h-4 w-4 text-indigo-600"
                          />
                          <span className="text-sm text-slate-700">
                            {option.option_order}. {option.option_text}
                            {option.image_url ? (
                              <img src={option.image_url} alt="" className="mt-2 max-h-36 rounded-lg border border-slate-100 object-contain" />
                            ) : null}
                          </span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <textarea
                      value={answers[question.id] || ''}
                      onChange={(e) => setAnswer(question.id, e.target.value)}
                      placeholder="Type your answer here"
                      rows={4}
                      className="mt-4 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    />
                  )}

                  <div className="mt-4 flex items-center justify-between">
                    <div />
                    <div className="flex gap-2">
                      {/* Prev disabled in secure mode to disable backtracking */}
                      {false ? (
                        <button className="rounded-xl bg-slate-200 px-4 py-2 text-sm">Previous</button>
                      ) : null}
                      {currentQuestionIndex < perQuestion.length - 1 ? (
                        <button onClick={() => setCurrentQuestionIndex((i) => i + 1)} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">Next</button>
                      ) : (
                        <button onClick={handleManualSubmit} className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white">Submit Exam</button>
                      )}
                    </div>
                  </div>
                </article>
              )
            })()
          ) : (
            perQuestion.map((question, index) => (
            <article key={question.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-semibold text-slate-900">Q{index + 1}. {question.title}</p>
                  <p className="mt-2 text-sm text-slate-500">{question.type} · {question.difficulty}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">{exam.questions[index]?.marks ?? 1} pts</span>
              </div>

              {question.image_url ? (
                <img src={question.image_url} alt="" className="mt-4 max-h-80 w-full rounded-xl border border-slate-200 object-contain" />
              ) : null}
              {(question.media_url || question.attachment_url) ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {question.media_url ? (
                    <a href={question.media_url} target="_blank" rel="noreferrer" className="rounded-lg bg-indigo-50 px-3 py-1.5 text-sm font-semibold text-indigo-700">
                      Open media
                    </a>
                  ) : null}
                  {question.attachment_url ? (
                    <a href={question.attachment_url} target="_blank" rel="noreferrer" className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700">
                      Open attachment
                    </a>
                  ) : null}
                </div>
              ) : null}

              {question.options?.length ? (
                <div className="mt-4 space-y-3">
                  {question.options.map((option) => (
                    <label key={option.id} className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <input
                        type={question.type === 'mcq' ? 'radio' : 'radio'}
                        name={`question-${question.id}`}
                        value={option.option_text}
                        checked={answers[question.id] === option.option_text}
                        onChange={(e) => setAnswer(question.id, e.target.value)}
                        className="h-4 w-4 text-indigo-600"
                      />
                      <span className="text-sm text-slate-700">
                        {option.option_order}. {option.option_text}
                        {option.image_url ? (
                          <img src={option.image_url} alt="" className="mt-2 max-h-36 rounded-lg border border-slate-100 object-contain" />
                        ) : null}
                      </span>
                    </label>
                  ))}
                </div>
              ) : (
                <textarea
                  value={answers[question.id] || ''}
                  onChange={(e) => setAnswer(question.id, e.target.value)}
                  placeholder="Type your answer here"
                  rows={4}
                  className="mt-4 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
              )}
            </article>
          ))
          )}
        </section>

        <aside className="space-y-5">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Exam summary</h2>
            <dl className="mt-4 space-y-3 text-sm text-slate-600">
              <div className="flex justify-between">
                <span>Duration</span>
                <span>{exam.duration_minutes} min</span>
              </div>
              <div className="flex justify-between">
                <span>Total marks</span>
                <span>{exam.total_marks}</span>
              </div>
              <div className="flex justify-between">
                <span>Question count</span>
                <span>{questions.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Attempt</span>
                <span>#{attempt.attemptNumber}</span>
              </div>
            </dl>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Instructions</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li>Answer every question to maximize your score.</li>
              <li>Your answers are saved automatically while you work.</li>
              <li>When time reaches zero, the exam submits automatically.</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  )
}
