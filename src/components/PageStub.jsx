export default function PageStub({ title, description }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 px-6 py-10">
      <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
        <h1 className="text-4xl font-bold text-slate-900">{title}</h1>
        <p className="mt-4 text-lg text-slate-600">{description}</p>
        <div className="mt-8 rounded-2xl bg-slate-100 p-6 text-slate-700">
          This placeholder page is part of the Phase 1 frontend scaffold.
        </div>
      </div>
    </div>
  )
}
