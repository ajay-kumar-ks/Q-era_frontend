import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'

function updateCommentInTree(items, updated) {
  return items.map((comment) => {
    if (comment.id === updated.id) {
      return { ...comment, ...updated }
    }
    if (comment.replies?.length) {
      return { ...comment, replies: updateCommentInTree(comment.replies, updated) }
    }
    return comment
  })
}

function CommentItem({ comment, depth, onReply, onUpvote, onMarkHelpful, actionLoading }) {
  const [replyOpen, setReplyOpen] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [posting, setPosting] = useState(false)
  const marginClass = depth > 0 ? 'ml-6 border-l border-slate-200 pl-4' : ''

  const submitReply = async (event) => {
    event.preventDefault()
    if (!replyText.trim()) return
    setPosting(true)
    await onReply(comment.id, replyText.trim())
    setReplyText('')
    setReplyOpen(false)
    setPosting(false)
  }

  return (
    <div className={`rounded-xl bg-white p-4 ${marginClass}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs text-slate-500">{comment.author_name || `User #${comment.user_id}`}</p>
          <p className="mt-1 text-xs text-slate-400">{new Date(comment.created_at).toLocaleString()}</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium">
          <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">{comment.upvotes_count} upvotes</span>
          {comment.is_helpful ? <span className="rounded-full bg-emerald-100 px-2 py-1 text-emerald-700">Helpful</span> : null}
        </div>
      </div>

      <p className="mt-3 text-sm text-slate-800">
        {comment.is_flagged ? <span className="italic text-slate-400">Comment hidden</span> : comment.content}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
        <button
          type="button"
          onClick={() => onUpvote(comment.id)}
          disabled={comment.upvoted || actionLoading}
          title={comment.upvoted ? 'Already upvoted' : 'Upvote comment'}
          className={`inline-flex items-center justify-center rounded-lg p-2 font-semibold ${comment.upvoted ? 'bg-slate-200 text-slate-500' : 'bg-indigo-600 text-white hover:bg-indigo-700'} disabled:cursor-not-allowed disabled:opacity-60`}
        >
          <span aria-hidden="true">👍</span>
          <span className="sr-only">{comment.upvoted ? 'Upvoted' : 'Upvote'}</span>
        </button>
        {!comment.is_helpful ? (
          <button
            type="button"
            onClick={() => onMarkHelpful(comment.id)}
            disabled={actionLoading}
            title="Mark comment as helpful"
            className="inline-flex items-center justify-center rounded-lg bg-emerald-600 p-2 font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span aria-hidden="true">✅</span>
            <span className="sr-only">Mark helpful</span>
          </button>
        ) : null}
        <button
          type="button"
          className="rounded-lg text-indigo-600 hover:text-indigo-700"
          onClick={() => setReplyOpen((v) => !v)}
        >
          {replyOpen ? 'Cancel' : 'Reply'}
        </button>
      </div>

      {replyOpen && (
        <form onSubmit={submitReply} className="mt-3 space-y-2">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            placeholder="Write a reply..."
            required
          />
          <button
            type="submit"
            disabled={posting}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {posting ? 'Posting...' : 'Post reply'}
          </button>
        </form>
      )}

      {!!comment.replies?.length && (
        <div className="mt-3 space-y-3">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              onReply={onReply}
              onUpvote={onUpvote}
              onMarkHelpful={onMarkHelpful}
              actionLoading={actionLoading}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function CommentSection({ questionId }) {
  const { user } = useAuth()
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [content, setContent] = useState('')
  const [posting, setPosting] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [sortBy, setSortBy] = useState('newest')

  const loadComments = async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get(`/questions/${questionId}/comments`, {
        params: { sort_by: sortBy },
      })
      setComments(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load comments.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadComments()
  }, [questionId, sortBy])

  const submitComment = async (event) => {
    event.preventDefault()
    if (!content.trim()) return
    setPosting(true)
    setError('')
    try {
      await api.post(`/questions/${questionId}/comments`, { content: content.trim() })
      setContent('')
      await loadComments()
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to post comment.')
    } finally {
      setPosting(false)
    }
  }

  const submitReply = async (parentId, replyContent) => {
    setError('')
    try {
      await api.post(`/questions/${questionId}/comments/${parentId}/reply`, {
        content: replyContent,
      })
      await loadComments()
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to post reply.')
    }
  }

  const handleUpvote = async (commentId) => {
    if (!user) {
      setError('Please sign in to upvote comments.')
      return
    }
    setActionLoading(true)
    setError('')
    try {
      await api.post(`/questions/${questionId}/comments/${commentId}/upvote`)
      await loadComments()
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to upvote comment.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleMarkHelpful = async (commentId) => {
    if (!user) {
      setError('Please sign in to mark comments helpful.')
      return
    }
    setActionLoading(true)
    setError('')
    try {
      await api.put(`/questions/${questionId}/comments/${commentId}/helpful`)
      await loadComments()
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to mark comment helpful.')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Comments</h3>
          <p className="text-sm text-slate-600">Join the discussion and sort by newest or most helpful.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {[
            ['newest', 'Newest'],
            ['helpful', 'Most helpful'],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setSortBy(value)}
              disabled={sortBy === value}
              className={`rounded-full px-3 py-1 text-sm font-semibold ${
                sortBy === value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              } disabled:cursor-not-allowed disabled:opacity-80`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={submitComment} className="mt-5 space-y-3">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          rows={3}
          placeholder="Add a comment..."
          required
        />
        <button
          type="submit"
          disabled={posting}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {posting ? 'Posting...' : 'Post comment'}
        </button>
      </form>

      {loading ? <p className="mt-4 text-sm text-slate-500">Loading comments...</p> : null}
      {error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}

      {!loading && !comments.length ? (
        <p className="mt-4 text-sm text-slate-500">No comments yet.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              depth={0}
              onReply={submitReply}
              onUpvote={handleUpvote}
              onMarkHelpful={handleMarkHelpful}
              actionLoading={actionLoading}
            />
          ))}
        </div>
      )}
    </section>
  )
}
