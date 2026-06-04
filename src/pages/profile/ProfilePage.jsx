import { useEffect, useState } from "react";
import api from "../../services/api";

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await api.get("/users/me");
        setProfile(response.data);
      } catch (err) {
        setError("Unable to load profile.");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  if (loading) {
    return <div className="p-8">Loading profile...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-500 dark:text-rose-300">{error}</div>;
  }

  if (!profile) {
    return <div className="p-8 text-slate-500 dark:text-slate-400">No profile information available.</div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8 flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{profile.name}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{profile.email}</p>
          <p className="mt-3 text-slate-700 dark:text-slate-300">{profile.bio || "No bio added yet."}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h2 className="text-lg font-semibold mb-3 text-slate-900 dark:text-slate-100">Stats</h2>
          <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
            <div>Global Rank: {profile.stats.global_rank ?? "N/A"}</div>
            <div>Exams Attended: {profile.stats.exams_attended}</div>
            <div>Exams Created: {profile.stats.exams_created}</div>
            <div>Questions Created: {profile.stats.questions_created}</div>
            <div>Accuracy: {profile.stats.accuracy?.toFixed(1)}%</div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900 md:col-span-2">
          <h2 className="text-lg font-semibold mb-3 text-slate-900 dark:text-slate-100">Recent Activity</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Recent Questions</h3>
              {profile.recent_questions.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">No recent questions.</p>
              ) : (
                <div className="mt-3 grid gap-3">
                  {profile.recent_questions.map((question) => (
                    <div key={question.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-sm transition hover:bg-white dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700">
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-medium text-slate-900 dark:text-slate-100">{question.title}</div>
                        {question.status && question.status !== "approved" ? (
                          <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">
                            {question.status}
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">Difficulty: {question.difficulty}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Recent Exams</h3>
              {profile.recent_exams.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">No recent exams.</p>
              ) : (
                <div className="mt-3 grid gap-3">
                  {profile.recent_exams.map((exam) => (
                    <div key={exam.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-sm transition hover:bg-white dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700">
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-medium text-slate-900 dark:text-slate-100">{exam.title}</div>
                        {exam.status && exam.status !== "approved" ? (
                          <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">
                            {exam.status}
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">Marks: {exam.total_marks} • Duration: {exam.duration_minutes} mins</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
