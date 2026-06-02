import { useEffect, useState } from "react";
import api from "../../services/api";

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadBookmarks = async () => {
    try {
      const response = await api.get("/users/me/bookmarks");
      setBookmarks(response.data);
    } catch (err) {
      setError("Unable to load bookmarks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookmarks();
  }, []);

  const removeBookmark = async (questionId) => {
    try {
      await api.post(`/questions/${questionId}/bookmark`);
      await loadBookmarks();
    } catch {
      setError("Unable to remove bookmark.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">My Bookmarks</h1>
      {loading ? (
        <div className="text-center py-16">Loading bookmarks...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : bookmarks.length === 0 ? (
        <div className="text-gray-600">You have not saved any bookmarks yet.</div>
      ) : (
        <div className="space-y-4">
          {bookmarks.map((bookmark) => (
            <div key={bookmark.id} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start">
                <div>
                  <div className="text-lg font-semibold">{bookmark.title}</div>
                  <div className="mt-2 text-sm text-gray-600">{bookmark.description}</div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500">
                    <span className="rounded-full bg-gray-100 px-2 py-1">{bookmark.type}</span>
                    <span className="rounded-full bg-gray-100 px-2 py-1">Difficulty: {bookmark.difficulty}</span>
                    <span className="rounded-full bg-gray-100 px-2 py-1">Likes: {bookmark.likes_count}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeBookmark(bookmark.id)}
                  className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
