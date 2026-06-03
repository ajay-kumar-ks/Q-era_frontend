import { Link } from 'react-router-dom'
import { useMemo, useState } from 'react'
import useQuestions from '../../hooks/useQuestions'

const DIFFICULTY = ['all', 'easy', 'medium', 'hard']
const TYPES = ['all', 'mcq', 'true_false', 'short_answer', 'descriptive']

export default function QuestionsPage() {
  const { items, loading, error, page, setPage, optimisticLikeToggle, optimisticBookmarkToggle } =
    useQuestions(20)
  const [search, setSearch] = useState('')
  const [difficulty, setDifficulty] = useState('all')
  const [type, setType] = useState('all')
  const [mode, setMode] = useState('keyword')

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    return items.filter((q) => {
      const text = `${q.title} ${q.description || ''} ${(q.tags || []).map((t) => t.name).join(' ')}`.toLowerCase()
      const searchMatch = !keyword || text.includes(keyword)
      const diffMatch = difficulty === 'all' || q.difficulty === difficulty
      const typeMatch = type === 'all' || q.type === type
      return searchMatch && diffMatch && typeMatch
    })
  }, [items, search, difficulty, type])

  const toggleLike = async (id) => {
    const question = items.find((q) => q.id === id)
    if (!question) return
    await optimisticLikeToggle(id, !question.liked)
  }

  const toggleBookmark = async (id) => {
    const question = items.find((q) => q.id === id)
    if (!question) return
    await optimisticBookmarkToggle(id, !question.bookmarked)
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold text-slate-900">Questions</h1>
        <Link
          to="/questions/create"
          className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Create question
        </Link>
      </div>

      <div className="mb-6 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title, description, tags"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 md:col-span-2"
        />
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          {DIFFICULTY.map((d) => (
            <option key={d} value={d}>
              Difficulty: {d}
            </option>
          ))}
        </select>
        <select value={type} onChange={(e) => setType(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          {TYPES.map((t) => (
            <option key={t} value={t}>
              Type: {t}
            </option>
          ))}
        </select>
        <div className="md:col-span-4">
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
            {['keyword', 'semantic'].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                  mode === m ? 'bg-indigo-600 text-white' : 'text-slate-600'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading && <p className="text-sm text-slate-500">Loading questions...</p>}
      {error && <p className="text-sm text-rose-600">{error}</p>}
      {!loading && !filtered.length && <p className="text-sm text-slate-500">No questions found.</p>}

      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((q) => (
          <article key={q.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            {q.image_url ? (
              <img src={q.image_url} alt="" className="mb-4 h-36 w-full rounded-xl border border-slate-100 object-cover" />
            ) : null}
            <Link to={`/questions/${q.id}`} className="text-lg font-semibold text-slate-900 hover:text-indigo-700">
              {q.title}
            </Link>
            <p className="mt-2 text-sm text-slate-500">By {q.author_name}</p>
            <p className="mt-2 line-clamp-2 text-sm text-slate-600">{q.description || 'No description.'}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium capitalize text-indigo-700">
                {q.difficulty}
              </span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                {q.type}
              </span>
              {(q.tags || []).map((tag) => (
                <span key={tag.id} className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs text-emerald-700">
                  #{tag.name}
                </span>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={() => toggleLike(q.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  q.liked ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'
                }`}
              >
                ❤ {q.likes_count}
              </button>
              <button
                type="button"
                onClick={() => toggleBookmark(q.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  q.bookmarked ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                }`}
              >
                {q.bookmarked ? 'Bookmarked' : 'Bookmark'}
              </button>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => setPage(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-40"
        >
          Previous
        </button>
        <span className="text-sm text-slate-600">Page {page}</span>
        <button
          type="button"
          onClick={() => setPage(page + 1)}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
        >
          Next
        </button>
      </div>
    </div>
  )
}
