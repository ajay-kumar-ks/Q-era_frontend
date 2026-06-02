import { useState } from "react";
import api from "../../services/api";

export default function BatchModerationPage() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const runBatch = async () => {
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const res = await api.post("/admin/moderate/batch");
      setResult(res.data);
    } catch (err) {
      setError("Batch moderation failed.");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Batch AI Moderation</h1>
      <p className="mb-4 text-gray-600">Run the AI moderation job across unreviewed content. The backend will return a summary report.</p>
      <div className="flex gap-2">
        <button onClick={runBatch} disabled={running} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
          {running ? "Running..." : "Run Batch AI Moderation"}
        </button>
      </div>

      {error && <div className="mt-4 text-red-500">{error}</div>}

      {result && (
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-3">Summary</h2>
          <pre className="whitespace-pre-wrap text-sm text-gray-700">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
