import { useEffect, useState } from "react";
import api from "../../services/api";
import Loader from "../../components/common/Loader";

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
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-4 text-3xl font-bold text-slate-900 dark:text-slate-100">My Bookmarks</h1>
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200">{error}</div>
      ) : bookmarks.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">You have not saved any bookmarks yet.</div>
      ) : (
        <div className="space-y-4">
          {bookmarks.map((bookmark) => (
            <div key={bookmark.id} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">{bookmark.title}</div>
                  <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">{bookmark.description}</div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="rounded-full bg-slate-100 px-2 py-1 dark:bg-slate-800">{bookmark.type}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-1 dark:bg-slate-800">Difficulty: {bookmark.difficulty}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-1 dark:bg-slate-800">Likes: {bookmark.likes_count}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeBookmark(bookmark.id)}
                  className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 dark:bg-rose-700 dark:hover:bg-rose-600"
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
