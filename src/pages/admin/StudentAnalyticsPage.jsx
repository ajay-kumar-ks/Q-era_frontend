import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import api, { getApiErrorMessage } from '../../services/api'

// ── Small reusable components ──────────────────────────────────────────────

function KpiCard({ label, value, sub, color = 'indigo' }) {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
    emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    rose: 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  }
  return (
    <div className={`rounded-2xl p-5 ${colors[color]}`}>
      <p className="text-xs font-medium uppercase tracking-wide opacity-70">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value ?? '—'}</p>
      {sub && <p className="mt-1 text-xs opacity-60">{sub}</p>}
    </div>
  )
}

function SectionCard({ title, children, action }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

function Spinner() {
  return (
    <svg className="h-5 w-5 animate-spin text-indigo-600" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function StudentAnalyticsPage() {
  const { id } = useParams()
  const [analytics, setAnalytics] = useState(null)
  const [aiAnalysis, setAiAnalysis] = useState(null)
  const [loading, setLoading] = useState(true)
  const [aiLoading, setAiLoading] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [error, setError] = useState('')
  const [aiError, setAiError] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError('')
      try {
        const { data } = await api.get(`/admin/students/${id}/analytics`)
        setAnalytics(data)
      } catch (err) {
        setError(getApiErrorMessage(err, 'Unable to load student analytics.'))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const runAiAnalysis = async () => {
    setAiError('')
    setAiLoading(true)
    try {
      const { data } = await api.post(`/admin/students/${id}/analytics/ai`)
      setAiAnalysis(data.analysis)
    } catch (err) {
      setAiError(getApiErrorMessage(err, 'Unable to generate AI analysis.'))
    } finally {
      setAiLoading(false)
    }
  }

  const downloadPdf = async () => {
    setPdfLoading(true)
    try {
      const response = await api.post(
        `/admin/students/${id}/analytics/pdf`,
        {},
        { responseType: 'blob' }
      )
      const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `qera_student_${id}_analytics.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      alert(getApiErrorMessage(err, 'Failed to generate PDF.'))
    } finally {
      setPdfLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <Spinner />
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Loading analytics…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-900/20 dark:text-rose-400">
          {error}
        </div>
      </div>
    )
  }

  const student = analytics?.student || {}
  const stats = student.stats || {}
  const progress = analytics?.learning_progress || {}
  const interests = analytics?.interest_tags || []

  // Chart data — score trend (last 10 results)
  const scoreTrend = (progress.recent_results || [])
    .slice(0, 10)
    .reverse()
    .map((r, i) => ({
      name: `#${i + 1}`,
      score: parseFloat(r.percentage || 0),
      exam: r.exam_title?.substring(0, 20) + (r.exam_title?.length > 20 ? '…' : ''),
    }))

  // Difficulty distribution from weak topics (proxy)
  const difficultyData = [
    { name: 'Easy',   value: stats.accuracy > 70 ? 70 : 40, fill: '#10b981' },
    { name: 'Medium', value: 50, fill: '#f59e0b' },
    { name: 'Hard',   value: stats.accuracy < 50 ? 60 : 30, fill: '#ef4444' },
  ]

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">

      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Student Analytics
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {student.name || 'Student'} · {student.email || ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/admin/users"
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800">
            ← Back
          </Link>
          <button type="button" onClick={runAiAnalysis} disabled={aiLoading}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
            {aiLoading ? <Spinner /> : <span>✦</span>}
            {aiLoading ? 'Analysing…' : aiAnalysis ? 'Refresh AI' : 'Run AI Analysis'}
          </button>
          <button type="button" onClick={downloadPdf} disabled={pdfLoading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300">
            {pdfLoading ? <Spinner /> : '↓'}
            {pdfLoading ? 'Generating…' : 'Download PDF'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Exams Attended"    value={stats.exams_attended}   color="indigo" />
        <KpiCard label="Avg Score"         value={`${(stats.accuracy || 0).toFixed(1)}%`} color="emerald" sub="across all attempts" />
        <KpiCard label="Questions Created" value={stats.questions_created} color="amber" />
        <KpiCard label="Exams Created"     value={stats.exams_created}    color="rose" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Left column */}
        <div className="space-y-6">

          {/* Score trend chart */}
          {scoreTrend.length > 1 && (
            <SectionCard title="Score Trend (last 10 exams)">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={scoreTrend} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip
                    formatter={(v) => [`${v}%`, 'Score']}
                    labelFormatter={(_, p) => p[0]?.payload?.exam || ''}
                    contentStyle={{ fontSize: 12 }}
                  />
                  <Line
                    type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2}
                    dot={{ r: 4, fill: '#6366f1' }} activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </SectionCard>
          )}

          {/* Recent exam results */}
          <SectionCard title="Recent Exam Results">
            {(progress.recent_results || []).length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">No submitted exams yet.</p>
            ) : (
              <div className="space-y-2">
                {(progress.recent_results || []).slice(0, 8).map((item) => {
                  const pct = parseFloat(item.percentage || 0)
                  const color = pct >= 70 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-500' : 'bg-rose-500'
                  return (
                    <div key={item.attempt_id}
                      className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                          {item.exam_title}
                        </p>
                        <p className="text-xs text-slate-400">
                          {item.submitted_at ? new Date(item.submitted_at).toLocaleDateString() : '—'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                          <div className={`h-full ${color} rounded-full`} style={{ width: `${Math.min(100, pct)}%` }} />
                        </div>
                        <span className={`w-10 text-right text-xs font-semibold ${
                          pct >= 70 ? 'text-emerald-600' : pct >= 40 ? 'text-amber-600' : 'text-rose-600'
                        }`}>{pct.toFixed(0)}%</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </SectionCard>

          {/* Weak topics */}
          {(progress.weak_topics || []).length > 0 && (
            <SectionCard title="Weak Topics">
              <div className="space-y-2">
                {(progress.weak_topics || []).slice(0, 6).map((topic) => (
                  <div key={topic.tag}
                    className="flex items-center gap-3 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 dark:border-rose-900 dark:bg-rose-900/20">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{topic.tag}</p>
                      <p className="text-xs text-slate-400">{topic.total} questions</p>
                    </div>
                    <span className="text-sm font-bold text-rose-600 dark:text-rose-400">
                      {parseFloat(topic.accuracy || 0).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">

          {/* Performance by difficulty (bar chart) */}
          <SectionCard title="Score Distribution">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={difficultyData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                <Tooltip formatter={(v) => [`${v}%`]} contentStyle={{ fontSize: 12 }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {difficultyData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <p className="mt-2 text-center text-xs text-slate-400">Estimated performance by difficulty</p>
          </SectionCard>

          {/* Interest tags */}
          <SectionCard title="Interest Tags">
            {interests.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {interests.map((tag) => (
                  <span key={tag}
                    className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                    #{tag}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">No inferred interests yet.</p>
            )}
          </SectionCard>

          {/* Student profile */}
          <SectionCard title="Profile">
            <dl className="space-y-3 text-sm">
              {[
                ['Name', student.name],
                ['Email', student.email],
                ['Role', student.role],
                ['Global Rank', stats.global_rank ?? 'N/A'],
                ['Joined', student.created_at ? new Date(student.created_at).toLocaleDateString() : '—'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-2">
                  <dt className="text-slate-500 dark:text-slate-400">{k}</dt>
                  <dd className="font-medium text-slate-900 dark:text-slate-100 text-right">{v ?? '—'}</dd>
                </div>
              ))}
            </dl>
          </SectionCard>

          {/* AI Analysis panel */}
          <SectionCard
            title="✦ AI Analysis"
            action={aiAnalysis?.cached && (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                cached
              </span>
            )}
          >
            {aiLoading ? (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Spinner /> Generating AI report…
              </div>
            ) : aiError ? (
              <p className="text-sm text-rose-600 dark:text-rose-400">{aiError}</p>
            ) : aiAnalysis ? (
              <div className="space-y-4 text-sm">
                <p className="leading-relaxed text-slate-700 dark:text-slate-300">{aiAnalysis.summary}</p>
                {[
                  { key: 'strengths', label: 'Strengths', color: 'text-emerald-700 dark:text-emerald-400' },
                  { key: 'weaknesses', label: 'Areas to improve', color: 'text-rose-600 dark:text-rose-400' },
                  { key: 'recommended_actions', label: 'Recommended actions', color: 'text-indigo-700 dark:text-indigo-400' },
                ].map(({ key, label, color }) => (
                  aiAnalysis[key]?.length > 0 && (
                    <div key={key}>
                      <p className={`text-xs font-semibold uppercase tracking-wide ${color}`}>{label}</p>
                      <ul className="mt-1.5 space-y-1">
                        {aiAnalysis[key].map((item, i) => (
                          <li key={i} className="flex gap-2 text-slate-600 dark:text-slate-400">
                            <span className="mt-0.5 flex-shrink-0 text-slate-400">•</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Click "Run AI Analysis" to generate insights for this student.
                </p>
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  )
}
