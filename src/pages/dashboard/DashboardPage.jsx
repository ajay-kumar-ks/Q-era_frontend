import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import Loader from '../../components/common/Loader'

function StatCard({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{hint}</p>}
    </div>
  )
}

function EmptyState({ children }) {
  return <p className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">{children}</p>
}

function pct(value) {
  const number = Number(value || 0)
  return `${Math.round(number)}%`
}

function dateLabel(value) {
  if (!value) return 'Unknown'
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function ScoreHistory({ items }) {
  const max = Math.max(100, ...items.map((item) => Number(item.percentage || 0)))
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Score history</h2>
        <Link to="/exams" className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300">Practice</Link>
      </div>
      {!items.length ? (
        <EmptyState>Submit an exam to start building your score history.</EmptyState>
      ) : (
        <div className="flex h-48 items-end gap-3 border-b border-l border-slate-200 px-3 pt-4 dark:border-slate-700">
          {items.map((item) => (
            <div key={item.attempt_id} className="flex min-w-0 flex-1 flex-col items-center gap-2">
              <div
                className="w-full rounded-t-lg bg-indigo-600"
                style={{ height: `${Math.max(8, (Number(item.percentage || 0) / max) * 150)}px` }}
                title={`${item.exam_title}: ${pct(item.percentage)}`}
              />
              <span className="w-full truncate text-center text-[11px] text-slate-500 dark:text-slate-400">{pct(item.percentage)}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function DifficultyAccuracy({ items }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Accuracy by difficulty</h2>
      {!items.length ? (
        <div className="mt-5">
          <EmptyState>Accuracy appears after answered questions are submitted.</EmptyState>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {items.map((item) => (
            <div key={item.difficulty}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium capitalize text-slate-700 dark:text-slate-300">{item.difficulty}</span>
                <span className="text-slate-500 dark:text-slate-400">{item.correct}/{item.total} correct</span>
              </div>
              <div className="h-3 rounded-full bg-slate-100 dark:bg-slate-800">
                <div className="h-3 rounded-full bg-emerald-500" style={{ width: pct(item.accuracy) }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function CompletionTrend({ items }) {
  const max = Math.max(1, ...items.map((item) => Number(item.completed || 0)))
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Completion trend</h2>
      <div className="mt-5 flex h-28 items-end gap-2">
        {items.map((item) => (
          <div key={item.date} className="flex flex-1 flex-col items-center gap-2">
            <div
              className="w-full rounded-t-md bg-cyan-600"
              style={{ height: `${Math.max(6, (Number(item.completed || 0) / max) * 80)}px`, opacity: item.completed ? 1 : 0.25 }}
              title={`${dateLabel(item.date)}: ${item.completed} completed`}
            />
            <span className="hidden text-[10px] text-slate-400 sm:inline dark:text-slate-500">{new Date(item.date).getDate()}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [recentQuestions, setRecentQuestions] = useState([])
  const [recentExams, setRecentExams] = useState([])
  const [progress, setProgress] = useState(null)
  const [badges, setBadges] = useState([])
  const [loadError, setLoadError] = useState('')
  const [loading, setLoading] = useState(true)
  const [topicFilter, setTopicFilter] = useState('all')
  const [mistakeFilter, setMistakeFilter] = useState('all')

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setLoadError('')
      try {
        const [questionsRes, examsRes, progressRes, badgesRes] = await Promise.all([
          api.get('/questions/', { params: { page: 1, limit: 5 } }),
          api.get('/exams/', { params: { page: 1, limit: 5 } }),
          api.get('/users/me/progress'),
          api.get('/users/me/badges'),
        ])
        if (!cancelled) {
          setRecentQuestions(questionsRes.data ?? [])
          setRecentExams(examsRes.data ?? [])
          setProgress(progressRes.data)
          setBadges(badgesRes.data ?? [])
          setLoading(false)
        }
      } catch {
        if (!cancelled) {
          setLoadError('Could not load progress. Is the API running?')
          setLoading(false)
        }
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const weakTopics = progress?.weak_topics ?? []
  const reviewMistakes = progress?.review_mistakes ?? []
  const recommendation = progress?.recommendations ?? {}

  const filteredMistakes = useMemo(() => {
    return reviewMistakes.filter((item) => {
      const topicMatch = topicFilter === 'all' || (item.tags || []).includes(topicFilter)
      const difficultyMatch = mistakeFilter === 'all' || item.difficulty === mistakeFilter
      return topicMatch && difficultyMatch
    })
  }, [reviewMistakes, topicFilter, mistakeFilter])

  const summary = progress?.summary ?? {}

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Welcome back, {user?.name?.split(' ')[0]}</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">Your learning hub for questions, exams, and progress.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total exams" value={summary.total_exams ?? 0} hint={`${summary.submitted_attempts ?? 0} submitted attempts`} />
          <StatCard label="Average score" value={pct(summary.average_score)} hint="Across submitted attempts" />
          <StatCard label="Streak" value={`${summary.streak_days ?? 0} days`} hint="Consecutive exam days" />
          <StatCard label="Review due" value={summary.review_due ?? 0} hint="Incorrect answers to revisit" />
        </div>

        {loadError && (
          <p className="mt-6 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">{loadError}</p>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ScoreHistory items={progress?.score_history ?? []} />
        </div>
        <CompletionTrend items={progress?.completion_trend ?? []} />
      </div>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Achievements</h2>
          <span className="text-sm text-slate-500 dark:text-slate-400">Badges earned</span>
        </div>
        {!badges.length ? (
          <EmptyState>You haven't earned any badges yet. Complete exams or add questions to unlock achievements.</EmptyState>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {badges.map((badge) => (
              <div
                key={badge.id}
                className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-950/5 via-white to-slate-50 p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md dark:border-slate-700 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800"
              >
                <div className="absolute right-4 top-4 h-12 w-12 rounded-full bg-slate-900/5 blur-xl opacity-80" />
                <div className="relative flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-slate-200 bg-white text-2xl text-indigo-700 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-indigo-400">
                    {badge.icon_url ? (
                      <img src={badge.icon_url} alt={badge.name} className="h-12 w-12 rounded-full object-cover" />
                    ) : (
                      badge.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{badge.name}</p>
                    <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">{badge.description || 'Achievement unlocked'}</p>
                  </div>
                </div>
                {badge.unlocked_at ? (
                  <div className="mt-4 text-[11px] uppercase tracking-wide text-slate-400 dark:text-slate-500">Unlocked {new Date(badge.unlocked_at).toLocaleDateString()}</div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <DifficultyAccuracy items={progress?.accuracy_by_difficulty ?? []} />
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Weak topics</h2>
          {!weakTopics.length ? (
            <div className="mt-5">
              <EmptyState>No weak topics yet. Keep submitting exams to build topic insights.</EmptyState>
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {weakTopics.map((topic) => (
                <button
                  key={topic.tag}
                  type="button"
                  onClick={() => setTopicFilter(topic.tag)}
                  className={`w-full rounded-xl border px-4 py-3 text-left ${
                    topicFilter === topic.tag ? 'border-indigo-300 bg-indigo-50 dark:border-indigo-700 dark:bg-indigo-950' : 'border-slate-100 bg-slate-50 hover:border-indigo-200 dark:border-slate-800 dark:bg-slate-800 dark:hover:border-indigo-600'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">#{topic.tag}</span>
                    <span className="text-slate-500 dark:text-slate-400">{pct(topic.accuracy)}</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-white dark:bg-slate-700">
                    <div className="h-2 rounded-full bg-rose-500" style={{ width: pct(100 - Number(topic.accuracy || 0)) }} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Review mistakes</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Filter by weak topic or difficulty and revisit the exact questions you missed.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={topicFilter}
              onChange={(event) => setTopicFilter(event.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="all">All topics</option>
              {weakTopics.map((topic) => (
                <option key={topic.tag} value={topic.tag}>{topic.tag}</option>
              ))}
            </select>
            <select
              value={mistakeFilter}
              onChange={(event) => setMistakeFilter(event.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="all">All difficulty</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>

        {!filteredMistakes.length ? (
          <div className="mt-5">
            <EmptyState>No matching mistakes to review.</EmptyState>
          </div>
        ) : (
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {filteredMistakes.map((item) => (
              <Link
                key={item.question_id}
                to={`/questions/${item.question_id}`}
                className="rounded-xl border border-slate-100 bg-slate-50 p-4 hover:border-indigo-200 hover:bg-indigo-50/40 dark:border-slate-800 dark:bg-slate-800 dark:hover:border-indigo-600 dark:hover:bg-indigo-950/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{item.title}</p>
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs capitalize text-slate-600 dark:bg-slate-700 dark:text-slate-300">{item.difficulty}</span>
                </div>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{item.exam_title}</p>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">Your answer: <span className="font-medium text-slate-900 dark:text-slate-100">{item.your_answer || 'No answer'}</span></p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Correct: <span className="font-medium text-emerald-700 dark:text-emerald-400">{item.correct_answer || 'Not set'}</span></p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Practice again</h2>
          <div className="mt-4 space-y-3">
            {(recommendation.practice_again ?? []).length ? recommendation.practice_again.map((exam) => (
              <Link key={exam.id} to={`/exams/${exam.id}`} className="block rounded-xl border border-slate-100 px-4 py-3 hover:border-indigo-200 hover:bg-indigo-50/40 dark:border-slate-800 dark:hover:border-indigo-600 dark:hover:bg-indigo-950/40">
                <p className="font-medium text-slate-900 dark:text-slate-100">{exam.title}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{exam.duration_minutes} min · {exam.total_marks} marks</p>
              </Link>
            )) : <EmptyState>Low-score exams will appear here for another round.</EmptyState>}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Recommended questions</h2>
          <div className="mt-4 space-y-3">
            {(recommendation.recommended_questions ?? []).length ? recommendation.recommended_questions.map((question) => (
              <Link key={question.id} to={`/questions/${question.id}`} className="block rounded-xl border border-slate-100 px-4 py-3 hover:border-indigo-200 hover:bg-indigo-50/40 dark:border-slate-800 dark:hover:border-indigo-600 dark:hover:bg-indigo-950/40">
                <p className="font-medium text-slate-900 dark:text-slate-100">{question.title}</p>
                <p className="mt-1 text-xs capitalize text-slate-500 dark:text-slate-400">{question.difficulty} · {question.type}</p>
              </Link>
            )) : <EmptyState>Recommendations use your weak topics and bookmarks.</EmptyState>}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Recommended exams</h2>
          <div className="mt-4 space-y-3">
            {(recommendation.recommended_exams ?? []).length ? recommendation.recommended_exams.map((exam) => (
              <Link key={exam.id} to={`/exams/${exam.id}`} className="block rounded-xl border border-slate-100 px-4 py-3 hover:border-indigo-200 hover:bg-indigo-50/40 dark:border-slate-800 dark:hover:border-indigo-600 dark:hover:bg-indigo-950/40">
                <p className="font-medium text-slate-900 dark:text-slate-100">{exam.title}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{exam.duration_minutes} min · {exam.total_marks} marks</p>
              </Link>
            )) : <EmptyState>Exams matching your weak tags will show here.</EmptyState>}
          </div>
        </section>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Recent questions</h2>
            <Link to="/questions" className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300">View all</Link>
          </div>
          {recentQuestions.length === 0 ? (
            <EmptyState>No questions yet.</EmptyState>
          ) : (
            <ul className="space-y-3">
              {recentQuestions.map((q) => (
                <li key={q.id}>
                  <Link to={`/questions/${q.id}`} className="block rounded-xl border border-slate-100 px-4 py-3 hover:border-indigo-200 hover:bg-indigo-50/40 dark:border-slate-800 dark:hover:border-indigo-600 dark:hover:bg-indigo-950/40">
                    <p className="font-medium text-slate-900 dark:text-slate-100">{q.title}</p>
                    <p className="mt-1 text-xs capitalize text-slate-500 dark:text-slate-400">{q.difficulty} · {q.type}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Recent exams</h2>
            <Link to="/exams" className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300">View all</Link>
          </div>
          {recentExams.length === 0 ? (
            <EmptyState>No exams yet.</EmptyState>
          ) : (
            <ul className="space-y-3">
              {recentExams.map((exam) => (
                <li key={exam.id}>
                  <Link to={`/exams/${exam.id}`} className="block rounded-xl border border-slate-100 px-4 py-3 hover:border-indigo-200 hover:bg-indigo-50/40 dark:border-slate-800 dark:hover:border-indigo-600 dark:hover:bg-indigo-950/40">
                    <p className="font-medium text-slate-900 dark:text-slate-100">{exam.title}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{exam.duration_minutes} min · {exam.total_marks} marks</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
      </div>
    </div>
  )
}
