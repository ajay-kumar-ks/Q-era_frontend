import { Link } from 'react-router-dom'

export default function AdminImportExportLink() {
  return (
    <Link
      to="/admin/import-export"
      className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
    >
      Import / Export
    </Link>
  )
}

