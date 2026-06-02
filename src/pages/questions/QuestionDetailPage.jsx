import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../../services/api'
import CommentSection from '../../components/question/CommentSection'

export default function QuestionDetailPage() {
  const { id } = useParams()
  const [question, setQuestion] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showExplanation, setShowExplanation] = useState(false)
  const [aiExplanation, setAiExplanation] = useState('')
  const [bookmarked, setBookmarked] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const { data } = await api.get(`/questions/${id}`)
        setQuestion(data)
        setBookmarked(Boolean(data.bookmarked))
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to load question.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const onLike = async () => {
    if (!question || question.liked) return
    setQuestion((prev) => ({ ...prev, liked: true, likes_count: prev.likes_count + 1 }))
    try {
      const { data } = await api.post(`/questions/${id}/like`)
      setQuestion((prev) => ({ ...prev, ...data }))
    } catch {
      setQuestion((prev) => ({ ...prev, liked: false, likes_count: Math.max(0, prev.likes_count - 1) }))
    }
  }

  const onBookmark = async () => {
    if (!question) return
    const next = !bookmarked
    setBookmarked(next)
    try {
      const { data } = await api.post(`/questions/${id}/bookmark`)
      setBookmarked(Boolean(data.bookmarked))
    } catch {
      setBookmarked(!next)
    }
  }

  const fetchAIExplanation = async () => {
    if (!question) return
    if (aiExplanation) {
      setShowExplanation((v) => !v)
      return
    }
    try {
      const { data } = await api.post('/ai/explain', {
        question_id: Number(id),
        question: question.title,
      })
      const text = data?.explanation || data?.answer || question.explanation || 'No explanation available.'
      setAiExplanation(text)
    } catch {
      setAiExplanation(question.explanation || 'AI explanation service is unavailable.')
    } finally {
      setShowExplanation(true)
    }
  }

  if (loading) return <div className="mx-auto max-w-4xl px-4 py-8 text-sm text-slate-500">Loading question...</div>
  if (error) return <div className="mx-auto max-w-4xl px-4 py-8 text-sm text-rose-600">{error}</div>
  if (!question) return null

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">{question.title}</h1>
        <p className="mt-2 text-sm text-slate-500">By {question.author_name}</p>
        <p className="mt-2 text-slate-600">{question.description}</p>

        {question.image_url ? (
          <img
            src={question.image_url}
            alt=""
            className="mt-5 max-h-96 w-full rounded-xl border border-slate-200 object-contain"
          />
        ) : null}

        {(question.media_url || question.attachment_url) ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {question.media_url ? (
              <a
                href={question.media_url}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg bg-indigo-50 px-3 py-1.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-100"
              >
                Open media
              </a>
            ) : null}
            {question.attachment_url ? (
              <a
                href={question.attachment_url}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-200"
              >
                Open attachment
              </a>
            ) : null}
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium capitalize text-indigo-700">
            {question.difficulty}
          </span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
            {question.type}
          </span>
          {(question.tags || []).map((tag) => (
            <span key={tag.id} className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs text-emerald-700">
              #{tag.name}
            </span>
          ))}
        </div>

        {!!question.options?.length && (
          <div className="mt-5 space-y-2">
            <h2 className="text-sm font-semibold text-slate-700">Options</h2>
            {question.options.map((option) => (
              <div key={option.id} className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">
                {option.option_order}. {option.option_text}
                {option.image_url ? (
                  <img src={option.image_url} alt="" className="mt-2 max-h-48 rounded-lg border border-slate-100 object-contain" />
                ) : null}
              </div>
            ))}
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onLike}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
              question.liked ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'
            }`}
          >
            ❤ {question.likes_count}
          </button>
          <button
            type="button"
            onClick={onBookmark}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
              bookmarked ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {bookmarked ? 'Bookmarked' : 'Bookmark'}
          </button>
          <button
            type="button"
            onClick={fetchAIExplanation}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            {showExplanation ? 'Hide AI explanation' : 'Show AI explanation'}
          </button>
        </div>

        {showExplanation && (
          <div className="mt-4 rounded-xl bg-indigo-50 p-4 text-sm text-indigo-900">
            {aiExplanation || 'Loading explanation...'}
          </div>
        )}
      </article>

      <div className="mt-6">
        <CommentSection questionId={id} />
      </div>
    </div>
  )
}
