import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../../services/api'

export default function ExamLeaderboardPage() {
  const { id } = useParams()
  const [leaderboard, setLeaderboard] = useState([])
  const [examTitle, setExamTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadLeaderboard() {
      setLoading(true)
      setError('')
      try {
        const [examRes, boardRes] = await Promise.all([
          api.get(`/exams/${id}`),
          api.get(`/exams/${id}/leaderboard`),
        ])
        if (cancelled) return
        setExamTitle(examRes.data.title)
        setLeaderboard(boardRes.data || [])
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.detail || 'Failed to load leaderboard.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadLeaderboard()
    return () => {
      cancelled = true
    }
  }, [id])

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{examTitle ? `${examTitle} leaderboard` : 'Exam leaderboard'}</h1>
          <p className="text-slate-600">Top ranked submissions for this exam.</p>
        </div>
      </div>

      {loading && <p className="text-sm text-slate-500">Loading leaderboard...</p>}
      {error && <p className="text-sm text-rose-600">{error}</p>}
      {!loading && !leaderboard.length && <p className="text-sm text-slate-500">No leaderboard entries yet.</p>}

      {leaderboard.length > 0 && (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="px-6 py-4 font-semibold">Rank</th>
                <th className="px-6 py-4 font-semibold">Name</th>
                <th className="px-6 py-4 font-semibold">Score</th>
                <th className="px-6 py-4 font-semibold">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {leaderboard.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-semibold text-slate-900">{entry.rank}</td>
                  <td className="px-6 py-4 text-slate-700">{entry.name || entry.email}</td>
                  <td className="px-6 py-4 text-slate-700">{entry.score}</td>
                  <td className="px-6 py-4 text-slate-700">{Math.floor(entry.time_taken_seconds / 60)}m {entry.time_taken_seconds % 60}s</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
