import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../services/api";

export default function PublicProfilePage() {
  const { uid } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await api.get(`/users/${uid}`);
        setProfile(response.data);
      } catch (err) {
        setError("Unable to load profile.");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [uid]);

  if (loading) {
    return <div className="p-8">Loading profile...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-500">{error}</div>;
  }

  if (!profile) {
    return <div className="p-8 text-gray-600">Profile not found.</div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8 flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center">
        {profile.avatar_url ? (
          <img src={profile.avatar_url} alt="" className="h-20 w-20 rounded-full border border-slate-200 object-cover" />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-100 text-xl font-bold text-indigo-700">
            {profile.name?.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div>
          <h1 className="text-3xl font-bold">{profile.name}</h1>
          <p className="text-sm text-gray-600">{profile.email}</p>
          <p className="mt-3 text-gray-700">{profile.bio || "No bio available."}</p>
          {profile.learning_goals ? <p className="mt-2 text-sm text-slate-600">{profile.learning_goals}</p> : null}
          <div className="mt-3 flex flex-wrap gap-2">
            {(profile.preferred_topics || []).map((topic) => (
              <span key={topic} className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">#{topic}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-3">Stats</h2>
          <div className="space-y-3 text-sm text-slate-700">
            <div>Global Rank: {profile.stats.global_rank ?? "N/A"}</div>
            <div>Exams Attended: {profile.stats.exams_attended}</div>
            <div>Exams Created: {profile.stats.exams_created}</div>
            <div>Questions Created: {profile.stats.questions_created}</div>
            <div>Accuracy: {profile.stats.accuracy?.toFixed(1)}%</div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:col-span-2">
          <h2 className="text-lg font-semibold mb-3">Recent Activity</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-slate-900">Recent Questions</h3>
              {profile.recent_questions.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">No recent questions.</p>
              ) : (
                <div className="mt-3 grid gap-3">
                  {profile.recent_questions.map((question) => (
                    <div key={question.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-sm transition hover:bg-white">
                      <div className="font-medium text-slate-900">{question.title}</div>
                      <div className="mt-1 text-xs text-slate-500">Difficulty: {question.difficulty}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="font-semibold text-slate-900">Recent Exams</h3>
              {profile.recent_exams.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">No recent exams.</p>
              ) : (
                <div className="mt-3 grid gap-3">
                  {profile.recent_exams.map((exam) => (
                    <div key={exam.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-sm transition hover:bg-white">
                      <div className="font-medium text-slate-900">{exam.title}</div>
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
