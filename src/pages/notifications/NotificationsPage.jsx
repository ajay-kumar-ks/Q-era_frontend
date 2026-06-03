import { useEffect, useState } from "react";
import api from "../../services/api";
import Loader from "../../components/common/Loader";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadNotifications = async () => {
    try {
      const response = await api.get("/users/me/notifications");
      setNotifications(response.data);
    } catch (err) {
      setError("Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const markRead = async (notificationId) => {
    try {
      await api.put(`/users/me/notifications/${notificationId}/read`);
      await loadNotifications();
    } catch {
      setError("Unable to update notification status.");
    }
  };

  const markAllRead = async () => {
    try {
      await api.put("/users/me/notifications/read-all");
      await loadNotifications();
    } catch {
      setError("Unable to mark all notifications as read.");
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-100 px-6 py-6 shadow-sm dark:border-slate-700 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Notifications</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Review recent updates and activity on your account.</p>
        </div>
        <button
          type="button"
          onClick={markAllRead}
          className="inline-flex items-center justify-center rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600"
        >
          Mark all read
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700 shadow-sm dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200">{error}</div>
      ) : notifications.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-slate-50 px-6 py-12 text-center text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          No new notifications yet. Your latest activity will appear here.
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-900"
            >
              <div className="absolute right-6 top-6 h-12 w-12 rounded-full bg-indigo-100/70 blur-xl opacity-60 dark:bg-indigo-900/70" />
              <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{notification.message}</p>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{new Date(notification.created_at).toLocaleString()}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span
                    className={`rounded-full px-3 py-1 font-semibold ${
                      notification.is_read ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200' : 'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-200'
                    }`}
                  >
                    {notification.is_read ? 'Read' : 'Unread'}
                  </span>
                  {!notification.is_read && (
                    <button
                      type="button"
                      onClick={() => markRead(notification.id)}
                      className="rounded-2xl bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-900 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
