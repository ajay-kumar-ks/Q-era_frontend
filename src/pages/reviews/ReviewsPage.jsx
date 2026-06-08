import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import Loader from '../../components/common/Loader'

function ReviewCard({ review, onAttempt }) {
  const [showDetails, setShowDetails] = useState(false)
  const [userAnswer, setUserAnswer] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmitReview = async () => {
    if (!userAnswer.trim()) {
      alert('Please enter an answer')
      return
    }

    setIsSubmitting(true)
    try {
      await api.post(`/review/attempt/${review.id}`, {
        question_id: review.question_id,
        user_answer: userAnswer,
        is_correct: userAnswer.toLowerCase() === review.question.correct_answer.toLowerCase(),
        time_spent_seconds: 0,
      })
      
      onAttempt()
      setUserAnswer('')
      setShowDetails(false)
    } catch (error) {
      console.error('Failed to submit review:', error)
      alert('Failed to submit review attempt')
    } finally {
      setIsSubmitting(false)
    }
  }

  const question = review.question
  const daysUntilReview = Math.ceil(
    (new Date(review.next_review_at) - new Date()) / (1000 * 60 * 60 * 24)
  )

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">{question.title}</h3>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{question.description}</p>
          
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-400">
              {question.type}
            </span>
            <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
              question.difficulty === 'easy'
                ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
                : question.difficulty === 'medium'
                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400'
                : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
            }`}>
              {question.difficulty}
            </span>
            {question.tags.map((tag) => (
              <span key={tag} className="inline-block rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                #{tag}
              </span>
            ))}
          </div>
        </div>

        <div className="text-right">
          <p className="text-xs text-slate-500 dark:text-slate-400">Review #{review.review_count + 1}</p>
          <p className={`mt-1 text-sm font-semibold ${
            daysUntilReview <= 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-400'
          }`}>
            {daysUntilReview <= 0 ? 'Due now' : `Due in ${daysUntilReview}d`}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Ease: {review.ease_factor.toFixed(1)}
          </p>
        </div>
      </div>

      {showDetails && (
        <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-700">
          <div className="mb-3">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Correct Answer:</p>
            <p className="mt-1 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
              {question.correct_answer}
            </p>
          </div>

          <div className="mb-3">
            <label className="block text-sm font-medium text-slate-900 dark:text-slate-100">Your Answer:</label>
            <input
              type="text"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Enter your answer"
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-400"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSubmitReview}
              disabled={isSubmitting}
              className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 dark:bg-indigo-700 dark:hover:bg-indigo-600"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </button>
            <button
              onClick={() => setShowDetails(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {!showDetails && (
        <button
          onClick={() => setShowDetails(true)}
          className="mt-4 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Start Review
        </button>
      )}
    </div>
  )
}

function StatCard({ label, value, color = 'slate' }) {
  const colorClass = {
    slate: 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100',
    blue: 'bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-100',
    green: 'bg-green-100 text-green-900 dark:bg-green-950 dark:text-green-100',
    red: 'bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-100',
  }[color]

  return (
    <div className={`rounded-lg ${colorClass} p-4`}>
      <p className="text-sm font-medium opacity-75">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  )
}

export default function ReviewsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [dueReviews, setDueReviews] = useState([])
  const [allReviews, setAllReviews] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('due') // 'due' or 'all'
  const [filterDifficulty, setFilterDifficulty] = useState('all')
  const [sortBy, setSortBy] = useState('due') // 'due', 'ease', 'review_count'

  useEffect(() => {
    loadReviews()
  }, [])

  const loadReviews = async () => {
    setLoading(true)
    setError('')
    try {
      const [dueRes, allRes, statsRes] = await Promise.all([
        api.get('/review/scheduled', { params: { limit: 50 } }),
        api.get('/review/all', { params: { status_filter: 'pending', limit: 100 } }),
        api.get('/review/statistics'),
      ])

      setDueReviews(dueRes.data || [])
      setAllReviews(allRes.data || [])
      setStats(statsRes.data)
    } catch (err) {
      console.error('Failed to load reviews:', err)
      setError('Could not load reviews. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const filteredReviews = useMemo(() => {
    const reviews = activeTab === 'due' ? dueReviews : allReviews
    
    let filtered = reviews.filter((review) => {
      if (filterDifficulty !== 'all') {
        return review.question?.difficulty === filterDifficulty
      }
      return true
    })

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'due') {
        return new Date(a.next_review_at) - new Date(b.next_review_at)
      } else if (sortBy === 'ease') {
        return a.ease_factor - b.ease_factor
      } else if (sortBy === 'review_count') {
        return b.review_count - a.review_count
      }
      return 0
    })

    return filtered
  }, [activeTab, dueReviews, allReviews, filterDifficulty, sortBy])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Review Questions</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">Practice spaced repetition to reinforce your learning</p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
            {error}
          </div>
        )}

        {stats && (
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard label="Due Now" value={stats.due_count} color="red" />
            <StatCard label="Overdue" value={stats.overdue_count} color="blue" />
            <StatCard label="Scheduled" value={stats.total_scheduled} color="slate" />
            <StatCard label="Total Reviews" value={stats.total_reviews} color="green" />
            <StatCard 
              label="Accuracy" 
              value={`${Math.round(stats.review_accuracy)}%`} 
              color="green" 
            />
          </div>
        )}

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('due')}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                activeTab === 'due'
                  ? 'bg-indigo-600 text-white dark:bg-indigo-700'
                  : 'border border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              Due Now ({dueReviews.length})
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                activeTab === 'all'
                  ? 'bg-indigo-600 text-white dark:bg-indigo-700'
                  : 'border border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              All Reviews ({allReviews.length})
            </button>
          </div>

          <div className="flex gap-2">
            <select
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="all">All difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="due">Sort by Due Date</option>
              <option value="ease">Sort by Difficulty (Ease)</option>
              <option value="review_count">Sort by Review Count</option>
            </select>
          </div>
        </div>

        {filteredReviews.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 bg-white px-6 py-12 text-center dark:border-slate-700 dark:bg-slate-900">
            <p className="text-slate-600 dark:text-slate-400">
              {activeTab === 'due' 
                ? 'No reviews due right now. Great job staying on top of your learning!'
                : 'No review questions scheduled. Start an exam and answer some questions incorrectly to create reviews.'}
            </p>
            <Link
              to="/exams"
              className="mt-4 inline-block rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600"
            >
              Take an Exam
            </Link>
          </div>
        ) : (
          <div className="grid gap-5">
            {filteredReviews.map((review) => (
              <ReviewCard 
                key={`${review.id}-${review.question_id}`} 
                review={review} 
                onAttempt={loadReviews}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
