import { useCallback, useEffect, useMemo, useState } from 'react'
import api from '../services/api'

export default function useQuestions(initialLimit = 12) {
  const [items, setItems] = useState([])
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(initialLimit)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchQuestions = useCallback(
    async (nextPage = page, nextLimit = limit) => {
      setLoading(true)
      setError('')
      try {
        const { data } = await api.get('/questions/', {
          params: { page: nextPage, limit: nextLimit },
        })
        setItems(Array.isArray(data) ? data : [])
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to load questions.')
      } finally {
        setLoading(false)
      }
    },
    [page, limit],
  )

  useEffect(() => {
    fetchQuestions(page, limit)
  }, [page, limit, fetchQuestions])

  const optimisticLikeToggle = useCallback(
    async (questionId, shouldLike) => {
      const snapshot = items
      setItems((prev) =>
        prev.map((q) =>
          q.id === questionId
            ? {
                ...q,
                liked: shouldLike,
                likes_count: Math.max(0, q.likes_count + (shouldLike ? 1 : -1)),
              }
            : q,
        ),
      )

      if (!shouldLike) return

      try {
        const { data } = await api.post(`/questions/${questionId}/like`)
        setItems((prev) => prev.map((q) => (q.id === questionId ? { ...q, ...data } : q)))
      } catch {
        setItems(snapshot)
      }
    },
    [items],
  )

  const optimisticBookmarkToggle = useCallback(
    async (questionId, shouldBookmark) => {
      const snapshot = items
      setItems((prev) =>
        prev.map((q) =>
          q.id === questionId
            ? {
                ...q,
                bookmarked: shouldBookmark,
              }
            : q,
        ),
      )

      try {
        const { data } = await api.post(`/questions/${questionId}/bookmark`)
        setItems((prev) =>
          prev.map((q) => (q.id === questionId ? { ...q, bookmarked: Boolean(data.bookmarked) } : q)),
        )
      } catch {
        setItems(snapshot)
      }
    },
    [items],
  )

  return useMemo(
    () => ({
      items,
      page,
      limit,
      loading,
      error,
      setPage,
      setLimit,
      refresh: fetchQuestions,
      optimisticLikeToggle,
      optimisticBookmarkToggle,
    }),
    [
      items,
      page,
      limit,
      loading,
      error,
      fetchQuestions,
      optimisticLikeToggle,
      optimisticBookmarkToggle,
    ],
  )
}
