import { useEffect, useState } from "react";
import api, { getApiErrorMessage } from "../../services/api";

export default function AdminApprovalPage() {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviewingId, setReviewingId] = useState(null);
  const [notes, setNotes] = useState("");
  const [actionType, setActionType] = useState(null);

  useEffect(() => {
    loadApprovals();
  }, []);

  async function loadApprovals() {
    try {
      const res = await api.get("/admin/approvals/pending");
      setApprovals(res.data);
      setError(null);
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to load pending approvals."));
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(approvalId) {
    try {
      await api.post(`/admin/approvals/${approvalId}/approve`, {
        admin_notes: notes,
      });
      setApprovals(approvals.filter((a) => a.id !== approvalId));
      setReviewingId(null);
      setNotes("");
      setActionType(null);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to approve content."));
    }
  }

  async function handleReject(approvalId) {
    try {
      await api.post(`/admin/approvals/${approvalId}/reject`, {
        admin_notes: notes,
      });
      setApprovals(approvals.filter((a) => a.id !== approvalId));
      setReviewingId(null);
      setNotes("");
      setActionType(null);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to reject content."));
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center py-16">Loading approvals...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Content Approvals</h1>
        <p className="mt-1 text-slate-600">
          Review and approve pending questions and exams.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700 shadow-sm">
          {error}
        </div>
      )}

      {approvals.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-slate-500">No pending approvals</p>
          <p className="mt-2 text-sm text-slate-400">
            Pending items appear here when users submit questions or exams that require admin review.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {approvals.map((approval) => (
            <div
              key={approval.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                      {approval.content_type}
                    </span>
                    <span className="text-sm text-slate-500">
                      ID: {approval.content_id}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">
                    Submitted by User #{approval.submitted_by}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {new Date(approval.created_at).toLocaleString()}
                  </p>
                </div>

                {reviewingId === approval.id ? (
                  <button
                    onClick={() => {
                      setReviewingId(null);
                      setNotes("");
                      setActionType(null);
                    }}
                    className="ml-4 text-slate-500 hover:text-slate-700"
                  >
                    ✕
                  </button>
                ) : (
                  <button
                    onClick={() => setReviewingId(approval.id)}
                    className="ml-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                  >
                    Review
                  </button>
                )}
              </div>

              {reviewingId === approval.id && (
                <div className="mt-6 border-t border-slate-200 pt-6">
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      Review Notes
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Enter your review notes (optional)"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 focus:border-indigo-600 focus:outline-none"
                      rows="3"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApprove(approval.id)}
                      className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(approval.id)}
                      className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
