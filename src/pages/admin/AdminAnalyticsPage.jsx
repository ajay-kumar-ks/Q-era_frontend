import { useEffect, useState } from "react";
import api, { getApiErrorMessage } from "../../services/api";

export default function AdminAnalyticsPage() {
  const [overview, setOverview] = useState(null);
  const [moderation, setModeration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const [overviewRes, moderationRes] = await Promise.all([
          api.get("/admin/analytics/overview"),
          api.get("/admin/analytics/content-moderation"),
        ]);
        setOverview(overviewRes.data);
        setModeration(moderationRes.data);
      } catch (err) {
        setError(getApiErrorMessage(err, "Unable to load analytics."));
      } finally {
        setLoading(false);
      }
    }

    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center py-16">Loading analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700 shadow-sm">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Analytics</h1>
        <p className="mt-1 text-slate-600">Platform metrics and moderation overview.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Active Users (30d)"
          value={overview?.active_users_30d}
          icon="👥"
        />
        <MetricCard
          label="Questions Created (30d)"
          value={overview?.questions_created_30d}
          icon="❓"
        />
        <MetricCard
          label="Exams Taken (30d)"
          value={overview?.exams_taken_30d}
          icon="📝"
        />
        <MetricCard
          label="Avg Score (30d)"
          value={`${overview?.average_score_30d}%`}
          icon="📊"
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <ModerationCard
          title="Questions Moderation"
          flagged={moderation?.flagged_questions}
          total={moderation?.total_questions}
        />
        <ModerationCard
          title="Comments Moderation"
          flagged={moderation?.flagged_comments}
          total={moderation?.total_comments}
        />
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="text-3xl mb-2">{icon}</div>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-indigo-700">{value}</p>
    </div>
  );
}

function ModerationCard({ title, flagged, total }) {
  const flaggedPercent = total > 0 ? ((flagged / total) * 100).toFixed(1) : 0;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">{title}</h2>
      <div className="space-y-3">
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm text-slate-600">Flagged</span>
            <span className="text-sm font-semibold text-rose-700">{flagged}</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div
              className="bg-rose-500 h-2 rounded-full"
              style={{ width: `${Math.min(flaggedPercent * 2, 100)}%` }}
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm text-slate-600">Total</span>
            <span className="text-sm font-semibold text-slate-700">{total}</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div className="bg-slate-400 h-2 rounded-full" style={{ width: "100%" }} />
          </div>
        </div>
      </div>
      <p className="mt-4 text-xs text-slate-500">
        {flaggedPercent}% flagged rate
      </p>
    </div>
  );
}
