import { useEffect, useState } from "react";
import api from "../../services/api";

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
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Global Leaderboard</h1>
      <p className="text-sm text-gray-600 mb-6">
        See the top learners by total score and exam performance.
      </p>

      {loading ? (
        <div className="text-center py-16">Loading leaderboard...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : leaderboard.length === 0 ? (
        <div className="text-gray-600">No leaderboard data available yet.</div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Total Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Accuracy
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  Exams Completed
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {leaderboard.map((item, index) => (
                <tr key={item.user_id || index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.rank ?? index + 1}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.total_score}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.accuracy?.toFixed(1)}%</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.exams_attended}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
