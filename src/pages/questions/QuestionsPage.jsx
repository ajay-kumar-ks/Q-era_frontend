import { Link } from 'react-router-dom'
import { useCallback, useEffect, useRef, useState } from 'react'
import useQuestions from '../../hooks/useQuestions'
import Loader from '../../components/common/Loader'
import api from '../../services/api'
import { getStoredUser } from '../../services/api'
import GenerateQuestionsModal from '../../components/ai/GenerateQuestionsModal'

const DIFFICULTY = ['all', 'easy', 'medium', 'hard']
const TYPES = ['all', 'mcq', 'true_false', 'short_answer', 'descriptive']

export default function QuestionsPage() {
  // Base list (paginated, no search query active)
  const { items, loading: listLoading, error: listError, page, setPage, optimisticLikeToggle, optimisticBookmarkToggle } =
    useQuestions(20)

  const [search, setSearch] = useState('')
  const [difficulty, setDifficulty] = useState('all')
  const [type, setType] = useState('all')
  const [mode, setMode] = useState('keyword')
  const [showAIModal, setShowAIModal] = useState(false)

  const currentUser = getStoredUser()
  const isAdmin = currentUser?.role === 'admin'

  // Search results state
  const [searchResults, setSearchResults] = useState(null)   // null = not in search mode
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [searchMode, setSearchMode] = useState('keyword')    // what the backend actually used

  const debounceRef = useRef(null)

  const runSearch = useCallback(async (query, diffFilter, typeFilter, searchMode) => {
    if (!query.trim()) {
      setSearchResults(null)
      setSearchError('')
      return
    }

    setSearchLoading(true)
    setSearchError('')
    try {
      const params = new URLSearchParams({
        q: query.trim(),
        mode: searchMode,
        page: 1,
        page_size: 50,
      })
      if (diffFilter !== 'all') params.append('difficulty', diffFilter)
      if (typeFilter !== 'all') params.append('type', typeFilter)

      const { data } = await api.get(`/search/questions?${params}`)
      setSearchResults(data.results || [])
      setSearchMode(data.search_mode || searchMode)
    } catch (err) {
      setSearchError(err.response?.data?.detail || 'Search failed.')
      setSearchResults([])
    } finally {
      setSearchLoading(false)
    }
  }, [])

  // Debounce search as user types
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      runSearch(search, difficulty, type, mode)
    }, 400)
    return () => clearTimeout(debounceRef.current)
  }, [search, difficulty, type, mode, runSearch])

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

  // Decide what to display
  const isSearching = search.trim().length > 0
  const displayItems = isSearching ? (searchResults ?? []) : items
  const loading = isSearching ? searchLoading : listLoading
  const error = isSearching ? searchError : listError

  // Client-side difficulty/type filter still applied to browse list (not to search results — backend handles that)
  const filtered = isSearching
    ? displayItems
    : displayItems.filter((q) => {
        const diffMatch = difficulty === 'all' || q.difficulty === difficulty
        const typeMatch = type === 'all' || q.type === type
        return diffMatch && typeMatch
      })

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Questions</h1>
        <div className="flex items-center gap-2">
          {/* AI Generate / Request button — shown to all logged-in users */}
          {currentUser && (
            <button
              type="button"
              onClick={() => setShowAIModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
            >
              <span>✦</span>
              {isAdmin ? 'Generate with AI' : 'Request AI Questions'}
            </button>
          )}
          <Link
            to="/questions/create"
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Create question
          </Link>
        </div>
      </div>

      {/* AI Modal */}
      {showAIModal && (
        <GenerateQuestionsModal
          isAdmin={isAdmin}
          onClose={() => setShowAIModal(false)}
          onCreated={(count) => {
            // Refresh the question list after generation
            setPage(1)
          }}
        />
      )}

      {/* Filters */}
      <div className="mb-6 space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <div className="grid gap-3 md:grid-cols-4">
          <div className="relative md:col-span-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={mode === 'semantic' ? 'Describe what you\'re looking for…' : 'Search by title, description, tags'}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-400"
            />
            {searchLoading && (
              <span className="absolute right-3 top-2.5 text-xs text-indigo-500 animate-pulse">AI searching…</span>
            )}
          </div>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          >
            {DIFFICULTY.map((d) => (
              <option key={d} value={d}>Difficulty: {d}</option>
            ))}
          </select>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          >
            {TYPES.map((t) => (
              <option key={t} value={t}>Type: {t}</option>
            ))}
          </select>
        </div>

        {/* Search mode toggle */}
        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800">
            {['keyword', 'semantic'].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                  mode === m
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                {m === 'keyword' ? '🔤 Keyword' : '✦ AI Semantic'}
              </button>
            ))}
          </div>
          {isSearching && searchResults !== null && (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {filtered.length} result{filtered.length !== 1 ? 's' : ''} via{' '}
              <span className={searchMode === 'semantic' ? 'text-indigo-600 font-semibold' : ''}>
                {searchMode}
              </span>
              {searchMode === 'semantic' ? ' ✦' : ''}
            </span>
          )}
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <Loader />
        </div>
      )}
      {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}
      {!loading && !error && filtered.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {isSearching
              ? `No questions found for "${search}"${mode === 'semantic' ? ' — try rephrasing your query' : ''}`
              : 'No questions found.'}
          </p>
          {isSearching && mode === 'keyword' && (
            <button
              type="button"
              onClick={() => setMode('semantic')}
              className="mt-3 text-sm text-indigo-600 hover:underline"
            >
              Try AI semantic search instead →
            </button>
          )}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((q) => (
          <article key={q.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            {q.image_url ? (
              <img src={q.image_url} alt="" className="mb-4 h-36 w-full rounded-xl border border-slate-100 object-cover" />
            ) : null}
            <Link to={`/questions/${q.id}`} className="text-lg font-semibold text-slate-900 hover:text-indigo-700 dark:text-slate-100">
              {q.title}
            </Link>

            {/* Relevance score badge for semantic results */}
            {q.relevance_score !== undefined && (
              <span className="ml-2 rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300">
                {Math.round(q.relevance_score * 100)}% match
              </span>
            )}

            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              By{' '}
              {q.user_id ? (
                <Link to={`/profile/${q.user_id}`} className="font-semibold text-indigo-700 hover:underline dark:text-indigo-300">
                  {q.author_name}
                </Link>
              ) : (
                <span>{q.author_name}</span>
              )}
            </p>

            <p className="mt-2 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">{q.description || 'No description.'}</p>

            <div className="mt-3 flex flex-wrap gap-2">
              {q.difficulty && (
                <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium capitalize text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200">
                  {q.difficulty}
                </span>
              )}
              {q.type && (
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {q.type}
                </span>
              )}
              {(q.tags || []).map((tag) => (
                <span key={tag.id ?? tag} className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200">
                  #{tag.name ?? tag}
                </span>
              ))}
            </div>

            {/* Like/Bookmark — only available on browse list items (have full data) */}
            {q.likes_count !== undefined && (
              <div className="mt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => toggleLike(q.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                    q.liked ? 'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-200' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  ❤ {q.likes_count}
                </button>
                <button
                  type="button"
                  onClick={() => toggleBookmark(q.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                    q.bookmarked ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {q.bookmarked ? 'Bookmarked' : 'Bookmark'}
                </button>
              </div>
            )}
          </article>
        ))}
      </div>

      {/* Pagination — only shown when not in search mode */}
      {!isSearching && (
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
      )}
    </div>
  )
}
