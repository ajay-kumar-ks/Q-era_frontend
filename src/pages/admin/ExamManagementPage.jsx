import { useEffect, useState } from "react";
import api, { getApiErrorMessage } from "../../services/api";

export default function ExamManagementPage() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [topic, setTopic] = useState("");
  const [count, setCount] = useState(5);
  const [difficulty, setDifficulty] = useState("mixed");
  const [duration, setDuration] = useState(30);

  const loadExams = async () => {
    try {
      const res = await api.get("/admin/exams");
      setExams(res.data);
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to load exams."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExams();
  }, []);

  const removeExam = async (id) => {
    try {
      await api.delete(`/admin/exams/${id}`);
      setExams((c) => c.filter((e) => e.id !== id));
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to delete exam."));
    }
  };

  const generateExam = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const payload = { topic, count: Number(count), difficulty, duration: Number(duration) };
      await api.post(`/admin/exams/generate`, payload);
      setTopic("");
      setCount(5);
      setDifficulty("mixed");
      setDuration(30);
      await loadExams();
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to generate exam."));
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Exam Management</h1>
      {loading ? (
        <div className="text-center py-16">Loading exams...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-3">Generate AI Exam</h2>
            <form onSubmit={generateExam} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Topic</label>
                <input value={topic} onChange={(e) => setTopic(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Count</label>
                  <input type="number" min={1} value={count} onChange={(e) => setCount(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Duration (min)</label>
                  <input type="number" min={5} value={duration} onChange={(e) => setDuration(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Difficulty</label>
                <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                  <option value="mixed">Mixed</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Generate</button>
              </div>
            </form>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-3">Existing Exams</h2>
            {exams.length === 0 ? (
              <div className="text-gray-600">No exams found.</div>
            ) : (
              <div className="space-y-4">
                {exams.map((exam) => (
                  <div key={exam.id} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:flex sm:items-center sm:justify-between">
                    <div>
                      <div className="text-lg font-semibold">{exam.title || exam.topic || `Exam ${exam.id}`}</div>
                      <div className="text-sm text-gray-600">Questions: {exam.question_count ?? exam.questions?.length ?? 'N/A'}</div>
                      <div className="mt-1 text-xs text-gray-500">Duration: {exam.duration_minutes ?? exam.duration ?? 'N/A'} min</div>
                    </div>
                    <div className="mt-4 flex gap-2 sm:mt-0">
                      <button onClick={() => removeExam(exam.id)} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
