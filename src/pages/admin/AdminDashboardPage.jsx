import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { getApiErrorMessage } from "../../services/api";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({ total_users: 0, total_questions: 0, total_exams: 0, flagged_questions: 0, flagged_comments: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [flaggedQuestions, setFlaggedQuestions] = useState([]);
  const [flaggedComments, setFlaggedComments] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    async function loadStats() {
      try {
        const [statsRes, questionsRes, commentsRes, usersRes] = await Promise.all([
          api.get("/admin/stats"),
          api.get("/admin/questions/flagged"),
          api.get("/admin/comments/flagged"),
          api.get("/admin/users"),
        ]);
        setStats(statsRes.data);
        setFlaggedQuestions(questionsRes.data);
        setFlaggedComments(commentsRes.data);
        
        const activity = [
          ...usersRes.data.slice(0, 3).map(u => ({ id: `user-${u.id}`, type: 'user', text: `New user joined: ${u.name}`, date: u.created_at })),
          ...questionsRes.data.slice(0, 3).map(q => ({ id: `question-${q.id}`, type: 'flag', text: `Question flagged: ${q.title}`, date: q.created_at })),
          ...commentsRes.data.slice(0, 3).map(c => ({ id: `comment-${c.id}`, type: 'flag', text: `Comment flagged: ${c.content.substring(0, 50)}${c.content.length > 50 ? '...' : ''}`, date: c.created_at })),
        ].sort((a, b) => new Date(b.date) - new Date(a.date));
        
        setRecentActivity(activity);
      } catch (err) {
        console.error("Admin Dashboard load error:", err);
        setError(
          getApiErrorMessage(
            err,
            "Unable to load admin dashboard. Please ensure the API is running and you have admin privileges."
          ),
        );
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-100 px-6 py-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="mt-1 text-slate-600">Platform overview and moderation tools.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to="/admin/users" className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">
            User Management
          </Link>
          <Link to="/admin/exams" className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">
            Exam Management
          </Link>
          <Link to="/admin/moderation" className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">
            Content Moderation
          </Link>
          <Link to="/admin/analytics" className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">
            Analytics
          </Link>
          <Link to="/admin/approvals" className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">
            Approvals
          </Link>
          <Link
            to="/admin/import-export"
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Import / Export
          </Link>
          <Link
            to="/admin/groups"
            className="inline-flex items-center justify-center rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-100"
          >
            Student Groups
          </Link>
        </div>
      </div>


      {loading ? (
        <div className="text-center py-16 text-slate-500">Loading dashboard...</div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700 shadow-sm">{error}</div>
      ) : (
        <div className="space-y-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <StatCard label="Total Users" value={stats.total_users} />
            <StatCard label="Total Questions" value={stats.total_questions} />
            <StatCard label="Total Exams" value={stats.total_exams} />
            <StatCard label="Flagged Questions" value={stats.flagged_questions} type="danger" />
            <StatCard label="Flagged Comments" value={stats.flagged_comments} type="danger" />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <FlaggedItemsSection title="Flagged Questions" items={flaggedQuestions} type="question" />
            <FlaggedItemsSection title="Flagged Comments" items={flaggedComments} type="comment" />
          </div>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-5">Recent Activity Feed</h2>
            {!recentActivity.length ? (
              <p className="text-sm text-slate-500">No recent activity to show.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentActivity.map((act) => (
                  <div key={act.id} className="py-3 flex items-center justify-between text-sm">
                    <span className="text-slate-700">{act.text}</span>
                    <span className="text-slate-400">{new Date(act.date).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, type }) {
  const bgColor = type === "danger" ? "bg-rose-50" : "bg-white";
  const textColor = type === "danger" ? "text-rose-700" : "text-indigo-700";
  return (
    <div className={`rounded-2xl border border-slate-200 p-5 shadow-sm ${bgColor}`}>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${textColor}`}>{value}</p>
    </div>
  );
}

function FlaggedItemsSection({ title, items, type }) {
  const unflagItem = async (id) => {
    try {
      if (type === "question") {
        await api.put(`/admin/questions/${id}/unflag`);
      } else if (type === "comment") {
        await api.put(`/admin/comments/${id}/unflag`);
      }
      window.location.reload();
    } catch (err) {
      console.error(`Error unflagging ${type}:`, err);
      alert(`Failed to unflag ${type}.`);
    }
  };

  const deleteItem = async (id) => {
    try {
      if (type === "question") {
        await api.delete(`/admin/questions/${id}`);
      } else if (type === "comment") {
        await api.delete(`/admin/comments/${id}`);
      }
      window.location.reload();
    } catch (err) {
      console.error(`Error deleting ${type}:`, err);
      alert(`Failed to delete ${type}.`);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900 mb-5">{title}</h2>
      {items.length === 0 ? (
        <p className="text-sm text-slate-500">No {type}s to flag.</p>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="font-medium text-slate-900">{item.title || item.content}</p>
              <p className="text-sm text-slate-600 mt-1">By User ID: {item.user_id} - Created: {new Date(item.created_at).toLocaleDateString()}</p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => unflagItem(item.id)}
                  className="rounded-lg bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700 hover:bg-emerald-200"
                >
                  Unflag
                </button>
                <button
                  onClick={() => deleteItem(item.id)}
                  className="rounded-lg bg-rose-100 px-3 py-1 text-sm font-semibold text-rose-700 hover:bg-rose-200"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}