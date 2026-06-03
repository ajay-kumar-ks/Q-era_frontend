import { useEffect, useState } from "react";
import api from "../../services/api";
import Loader from "../../components/common/Loader";

export default function GlobalLeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const response = await api.get("/leaderboard/global");
        setLeaderboard(response.data);
      } catch (err) {
        setError("Unable to load global leaderboard.");
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboard();
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-4 text-3xl font-bold text-slate-900 dark:text-slate-100">Global Leaderboard</h1>
      <p className="mb-6 text-sm text-slate-600 dark:text-slate-400">
        See the top learners by total score and exam performance.
      </p>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200">{error}</div>
      ) : leaderboard.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">No leaderboard data available yet.</div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Total Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Accuracy
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Exams Completed
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-700 dark:bg-slate-900">
              {leaderboard.map((item, index) => (
                <tr key={item.user_id || index} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-900 dark:text-slate-100">{item.rank ?? index + 1}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-900 dark:text-slate-100">{item.name}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-900 dark:text-slate-100">{item.total_score}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-900 dark:text-slate-100">{item.accuracy?.toFixed(1)}%</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-900 dark:text-slate-100">{item.exams_attended}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
