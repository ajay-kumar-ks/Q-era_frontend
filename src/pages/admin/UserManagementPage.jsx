import { useEffect, useState } from "react";
import api, { getApiErrorMessage } from "../../services/api";

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadUsers = async () => {
    try {
      const response = await api.get("/admin/users");
      setUsers(response.data);
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to load user list."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const removeUser = async (userId) => {
    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers((current) => current.filter((user) => user.id !== userId));
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to delete user."));
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">User Management</h1>
      {loading ? (
        <div className="text-center py-16">Loading users...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <div className="space-y-4">
          {users.map((user) => (
            <div key={user.id} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:flex sm:items-center sm:justify-between">
              <div>
                <div className="text-lg font-semibold">{user.name}</div>
                <div className="text-sm text-gray-600">{user.email}</div>
                <div className="mt-1 text-xs text-gray-500">Role: {user.role}</div>
              </div>
              <button
                type="button"
                onClick={() => removeUser(user.id)}
                className="mt-4 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 sm:mt-0"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
