import { useEffect, useRef, useState } from 'react'
import { Users, Plus, Pencil, Trash2, UserPlus, UserMinus, Search, X, Check } from 'lucide-react'
import api from '../../services/api'

const GROUP_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f59e0b', '#10b981', '#06b6d4', '#3b82f6',
]

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  )
}

// ── Create / Edit group modal ──
function GroupModal({ group, onSave, onClose }) {
  const [form, setForm] = useState({
    name: group?.name || '',
    description: group?.description || '',
    color: group?.color || GROUP_COLORS[0],
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Name is required.'); return }
    setSaving(true)
    try {
      if (group) {
        const { data } = await api.put(`/admin/groups/${group.id}`, form)
        onSave(data)
      } else {
        const { data } = await api.post('/admin/groups', form)
        onSave(data)
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save group.')
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          {group ? 'Edit group' : 'New group'}
        </h3>

        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Name *</label>
            <input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              placeholder="e.g. Batch A, Physics 2026" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
            <textarea value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
              rows={2}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              placeholder="Optional description" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Color</label>
            <div className="mt-1.5 flex gap-2">
              {GROUP_COLORS.map(c => (
                <button key={c} type="button" onClick={() => setForm(p => ({ ...p, color: c }))}
                  style={{ backgroundColor: c }}
                  className={`h-7 w-7 rounded-full transition-transform ${form.color === c ? 'scale-125 ring-2 ring-white ring-offset-1' : 'hover:scale-110'}`} />
              ))}
            </div>
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm dark:border-slate-600 dark:text-slate-300">
            Cancel
          </button>
          <button type="button" onClick={handleSave} disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-40">
            {saving && <Spinner />} Save
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Add members panel ──
function AddMembersPanel({ group, onClose, onMembersChanged }) {
  const [query, setQuery] = useState('')
  const [topic, setTopic] = useState('')
  const [results, setResults] = useState([])
  const [members, setMembers] = useState([])
  const [searching, setSearching] = useState(false)
  const [loadingMembers, setLoadingMembers] = useState(true)
  const debounceRef = useRef(null)

  useEffect(() => {
    loadMembers()
  }, [group.id])

  async function loadMembers() {
    setLoadingMembers(true)
    try {
      const { data } = await api.get(`/admin/groups/${group.id}/members`)
      setMembers(data || [])
    } catch { /* ignore */ }
    finally { setLoadingMembers(false) }
  }

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!query.trim() && !topic.trim()) { setResults([]); return }
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const { data } = await api.get('/admin/users/search', { params: { q: query, topic, role: 'student' } })
        setResults(data || [])
      } catch { setResults([]) }
      finally { setSearching(false) }
    }, 350)
    return () => clearTimeout(debounceRef.current)
  }, [query, topic])

  const isMember = (userId) => members.some(m => m.id === userId)

  async function addUser(userId) {
    try {
      await api.post(`/admin/groups/${group.id}/members`, { user_ids: [userId] })
      await loadMembers()
      onMembersChanged()
    } catch { /* ignore */ }
  }

  async function removeUser(userId) {
    try {
      await api.delete(`/admin/groups/${group.id}/members/${userId}`)
      setMembers(prev => prev.filter(m => m.id !== userId))
      onMembersChanged()
    } catch { /* ignore */ }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 p-4">
      <div className="flex h-full w-full max-w-md flex-col rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: group.color }} />
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">{group.name}</h3>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              {members.length} members
            </span>
          </div>
          <button type="button" onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X size={16} />
          </button>
        </div>

        {/* Search */}
        <div className="border-b border-slate-100 p-4 dark:border-slate-800">
          <p className="mb-2 text-xs font-medium text-slate-500 dark:text-slate-400">Search students to add</p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
              <input value={query} onChange={e => setQuery(e.target.value)}
                placeholder="Name or email…"
                className="w-full rounded-lg border border-slate-300 bg-slate-50 pl-8 pr-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100" />
            </div>
            <input value={topic} onChange={e => setTopic(e.target.value)}
              placeholder="Topic tag…"
              className="w-28 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100" />
          </div>

          {searching && <p className="mt-1 text-xs text-slate-400">Searching…</p>}

          {results.length > 0 && (
            <div className="mt-2 max-h-48 overflow-y-auto space-y-1">
              {results.map(u => (
                <div key={u.id} className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800">
                  {u.avatar_url
                    ? <img src={u.avatar_url} className="h-7 w-7 rounded-full object-cover" alt="" />
                    : <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">{u.name?.[0]?.toUpperCase()}</div>}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{u.name}</p>
                    <p className="truncate text-xs text-slate-400">{u.email}</p>
                  </div>
                  <button type="button" onClick={() => isMember(u.id) ? removeUser(u.id) : addUser(u.id)}
                    className={`flex-shrink-0 rounded-lg p-1.5 text-xs ${
                      isMember(u.id)
                        ? 'text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30'
                        : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30'
                    }`}>
                    {isMember(u.id) ? <UserMinus size={14} /> : <UserPlus size={14} />}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Current members */}
        <div className="flex-1 overflow-y-auto p-4">
          <p className="mb-2 text-xs font-medium text-slate-500 dark:text-slate-400">Current members</p>
          {loadingMembers && <p className="text-xs text-slate-400">Loading…</p>}
          {!loadingMembers && members.length === 0 && (
            <p className="text-sm text-slate-400">No members yet. Search above to add students.</p>
          )}
          <div className="space-y-1">
            {members.map(m => (
              <div key={m.id} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-slate-50 dark:hover:bg-slate-800">
                {m.avatar_url
                  ? <img src={m.avatar_url} className="h-7 w-7 rounded-full object-cover" alt="" />
                  : <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">{m.name?.[0]?.toUpperCase()}</div>}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{m.name}</p>
                  <p className="truncate text-xs text-slate-400">{m.email}</p>
                </div>
                <button type="button" onClick={() => removeUser(m.id)}
                  className="flex-shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/30">
                  <UserMinus size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main page ──
export default function GroupManagementPage() {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingGroup, setEditingGroup] = useState(null)
  const [membersGroup, setMembersGroup] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  useEffect(() => { loadGroups() }, [])

  async function loadGroups() {
    setLoading(true)
    try {
      const { data } = await api.get('/admin/groups')
      setGroups(data || [])
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }

  function handleGroupSaved(saved) {
    setGroups(prev => {
      const exists = prev.find(g => g.id === saved.id)
      if (exists) return prev.map(g => g.id === saved.id ? { ...g, ...saved } : g)
      return [saved, ...prev]
    })
    setShowModal(false)
    setEditingGroup(null)
  }

  async function handleDelete(id) {
    try {
      await api.delete(`/admin/groups/${id}`)
      setGroups(prev => prev.filter(g => g.id !== id))
    } catch { /* ignore */ }
    finally { setDeleteConfirm(null) }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Student Groups</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Create groups to target exams at specific sets of students.
          </p>
        </div>
        <button type="button" onClick={() => { setEditingGroup(null); setShowModal(true) }}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
          <Plus size={16} /> New group
        </button>
      </div>

      {loading && <p className="text-sm text-slate-400">Loading…</p>}

      {!loading && groups.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 py-16 text-center dark:border-slate-700">
          <Users size={32} className="mx-auto text-slate-300" />
          <p className="mt-3 text-sm text-slate-500">No groups yet. Create your first group to get started.</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map(g => (
          <div key={g.id}
            className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            {/* Color bar */}
            <div className="mb-3 flex items-center gap-2">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: g.color }} />
              <h3 className="flex-1 truncate font-semibold text-slate-900 dark:text-slate-100">{g.name}</h3>
            </div>
            {g.description && (
              <p className="mb-2 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{g.description}</p>
            )}
            <div className="mb-4 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <Users size={12} />
              <span>{g.member_count} student{g.member_count !== 1 ? 's' : ''}</span>
            </div>
            <div className="mt-auto flex gap-2">
              <button type="button"
                onClick={() => setMembersGroup(g)}
                className="flex-1 rounded-lg bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300">
                Manage members
              </button>
              <button type="button" onClick={() => { setEditingGroup(g); setShowModal(true) }}
                className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
                <Pencil size={14} />
              </button>
              <button type="button" onClick={() => setDeleteConfirm(g.id)}
                className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:border-slate-700 dark:hover:bg-rose-900/30">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit modal */}
      {showModal && (
        <GroupModal
          group={editingGroup}
          onSave={handleGroupSaved}
          onClose={() => { setShowModal(false); setEditingGroup(null) }}
        />
      )}

      {/* Members side panel */}
      {membersGroup && (
        <AddMembersPanel
          group={membersGroup}
          onClose={() => setMembersGroup(null)}
          onMembersChanged={() => {
            setGroups(prev => prev.map(g =>
              g.id === membersGroup.id
                ? { ...g }  // trigger re-render; member count updated on reload
                : g
            ))
            loadGroups() // refresh count
          }}
        />
      )}

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Delete group?</h3>
            <p className="mt-2 text-sm text-slate-500">
              This will remove the group and all its member associations. Exams assigned to this group will become private.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setDeleteConfirm(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm dark:border-slate-600 dark:text-slate-300">
                Cancel
              </button>
              <button type="button" onClick={() => handleDelete(deleteConfirm)}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
