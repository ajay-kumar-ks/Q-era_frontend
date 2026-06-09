import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../../services/api'
import AIExplanation from '../../components/ai/AIExplanation'

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}m ${secs}s`
}

function normalize(value) {
  return String(value ?? '').trim().toLowerCase()
}

function isCorrectOption(question, option) {
  const correct = normalize(question?.correct_answer)
  // Match only by option_text — never by option_order, which causes false positives
  // when the answer is a number like "3" matching the 3rd option's order
  return correct !== '' && normalize(option.option_text) === correct
}

export default function ExamResultPage() {
  const { id, aid } = useParams()
  const [result, setResult] = useState(null)
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadResult() {
      setLoading(true)
      setError('')
      try {
        const { data } = await api.get(`/exams/${id}/result/${aid}`)
        if (cancelled) return
        setResult(data)
        const resultQuestionIds = (data.questions || []).map((item) => Number(item.question_id))
        const answeredQuestionIds = Object.keys(data.answers || {}).map((qid) => Number(qid))
        const questionIds = [...new Set([...resultQuestionIds, ...answeredQuestionIds])].filter(Boolean)
        const questionResponses = await Promise.all(questionIds.map((qid) => api.get(`/questions/${qid}`)))
        if (cancelled) return
        setQuestions(questionResponses.map((response) => response.data))
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.detail || 'Failed to load exam result.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadResult()
    return () => {
      cancelled = true
    }
  }, [id, aid])

  const questionMap = useMemo(() => {
    return questions.reduce((map, question) => {
      map[question.id] = question
      return map
    }, {})
  }, [questions])

  if (loading) return <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-slate-500">Loading exam result...</div>
  if (error) return <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-rose-600">{error}</div>
  if (!result) return null

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">Exam result</h1>
        <p className="mt-3 text-slate-600">Your score and question-by-question breakdown.</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Score</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">{result.score} / {result.total_marks}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Time</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">{formatTime(result.time_taken_seconds)}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Attempt</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">#{result.attempt_number}</p>
          </div>
        </div>

        <div className="mt-10 space-y-5">
          {(result.questions || []).map((resultQuestion) => {
            const questionId = String(resultQuestion.question_id)
            const answer = result.answers?.[questionId] ?? ''
            const question = questionMap[Number(questionId)]
            const correct = normalize(answer) && normalize(answer) === normalize(question?.correct_answer)
            return (
              <article key={questionId} className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{question ? question.title : `Question ${questionId}`}</p>
                    {question?.description && (
                      <pre className="mt-2 overflow-x-auto rounded-xl border border-slate-200 bg-slate-900 px-4 py-3 text-sm text-slate-100 whitespace-pre-wrap font-mono">
                        {question.description}
                      </pre>
                    )}
                    <p className="text-sm text-slate-500">Your answer</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-sm ${correct ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                    {correct ? 'Correct' : 'Review'}
                  </span>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl bg-white p-4 text-sm text-slate-700 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Submitted answer</p>
                    <p className="mt-2 font-medium text-slate-900">{answer || 'No answer'}</p>
                  </div>
                  <div className="rounded-2xl bg-white p-4 text-sm text-slate-700 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Correct answer</p>
                    <p className="mt-2 font-medium text-slate-900">{question?.correct_answer ?? 'Unknown'}</p>
                  </div>
                </div>

                {question?.options?.length ? (
                  <div className="mt-4 space-y-2">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Options</p>
                    {question.options.map((option) => {
                      const selected = normalize(answer) === normalize(option.option_text)
                      const correctOption = isCorrectOption(question, option)
                      return (
                        <div
                          key={option.id}
                          className={`rounded-2xl border px-4 py-3 text-sm ${
                            correctOption
                              ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                              : selected
                                ? 'border-rose-300 bg-rose-50 text-rose-900'
                                : 'border-slate-200 bg-white text-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span>{option.option_order}. {option.option_text}</span>
                            {correctOption ? <span className="text-xs font-semibold">Correct answer</span> : selected ? <span className="text-xs font-semibold">Your choice</span> : null}
                          </div>
                          {option.image_url ? <img src={option.image_url} alt="" className="mt-2 max-h-36 rounded-lg border border-white object-contain" /> : null}
                        </div>
                      )
                    })}
                  </div>
                ) : null}

                {/* AI Explanation — shown for all questions, prominent for wrong answers */}
                {question && (
                  <AIExplanation
                    questionId={question.id}
                    userAnswer={answer || null}
                    isCorrect={correct}
                    compact={true}
                  />
                )}
              </article>
            )
          })}
        </div>
      </div>
    </div>
  )
}
