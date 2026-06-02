import { useEffect, useState } from "react";
import api, { getApiErrorMessage } from "../../services/api";

export default function ContentModerationPage() {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadComments = async () => {
    try {
      const response = await api.get("/admin/comments/flagged");
      setComments(response.data);
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to load flagged comments."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, []);

  const unflag = async (id) => {
    try {
      await api.put(`/admin/comments/${id}/unflag`);
      await loadComments();
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to unflag comment."));
    }
  };

  const remove = async (id) => {
    try {
      await api.delete(`/admin/comments/${id}`);
      await loadComments();
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to delete comment."));
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Content Moderation</h1>
      {loading ? (
        <div className="text-center py-16">Loading flagged comments...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : comments.length === 0 ? (
        <div className="text-gray-600">No flagged comments found.</div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="font-medium">{comment.content}</p>
              <p className="mt-2 text-sm text-gray-500">Comment ID: {comment.id} • Question ID: {comment.question_id}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => unflag(comment.id)}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  Unflag
                </button>
                <button
                  type="button"
                  onClick={() => remove(comment.id)}
                  className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
