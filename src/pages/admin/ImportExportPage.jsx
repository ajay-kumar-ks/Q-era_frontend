import { useMemo, useState } from 'react'
import api, { getApiErrorMessage } from '../../services/api'

function FilePicker({ label, accept, onFileChange }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">{label}</label>
      <input
        type="file"
        accept={accept}
        onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
        className="mt-1 block w-full rounded-md border border-slate-300 bg-white p-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
      />
    </div>
  )
}

function downloadTextFile({ filename, content, mimeType = 'text/plain' }) {
  const blob = new Blob([content], { type: mimeType })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(url)
}

function downloadBlob({ filename, blob }) {
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(url)
}

export default function ImportExportPage() {
  const [tab, setTab] = useState('questions') // questions | exams
  const [ids, setIds] = useState('') // comma-separated

  const [qImportFile, setQImportFile] = useState(null)
  const [eImportFile, setEImportFile] = useState(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)

  const idList = useMemo(() => {
    const trimmed = ids.trim()
    if (!trimmed) return null
    const parsed = trimmed
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean)
      .map((x) => Number(x))
      .filter((n) => Number.isFinite(n))
    return parsed.length ? parsed : null
  }, [ids])

  const handleExport = async () => {
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      const res =
        tab === 'questions'
          ? idList
            ? await api.get(`/questions/export/csv?question_ids=${encodeURIComponent(idList.join(','))}`, { responseType: 'text' })
            : await api.get('/questions/export/csv', { responseType: 'text' })
          : idList
          ? await api.get(`/exams/export/csv?exam_ids=${encodeURIComponent(idList.join(','))}`, { responseType: 'text' })
          : await api.get('/exams/export/csv', { responseType: 'text' })

      downloadTextFile({
        filename: tab === 'questions' ? 'questions_export.csv' : 'exams_export.csv',
        content: res.data,
        mimeType: 'text/csv',
      })

      setMessage('Export successful. Download started.')
    } catch (e) {
      setError(getApiErrorMessage(e, 'Export failed.'))
    } finally {
      setLoading(false)
    }
  }


  const handleExportExcel = async () => {
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      const filename = tab === 'questions' ? 'questions_export.xlsx' : 'exams_export.xlsx'
      let res

      if (tab === 'questions') {
        res = await (idList
          ? api.get(
              `/questions/export/excel?question_ids=${encodeURIComponent(idList.join(','))}`,
              { responseType: 'blob' }
            )
          : api.get('/questions/export/excel', { responseType: 'blob' }))
      } else {
        res = await (idList
          ? api.get(`/exams/export/excel?exam_ids=${encodeURIComponent(idList.join(','))}`, { responseType: 'blob' })
          : api.get('/exams/export/excel', { responseType: 'blob' }))
      }

      downloadBlob({ filename, blob: res.data })
      setMessage('Excel export successful. Download started.')
    } catch (e) {
      setError(getApiErrorMessage(e, 'Excel export failed.'))
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async () => {
    const file = tab === 'questions' ? qImportFile : eImportFile
    if (!file) {
      setError('Please choose a file to import.')
      return
    }

    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      const form = new FormData()
      form.append('file', file)

      const isCsv = file.name.toLowerCase().endsWith('.csv')

      const res = await (tab === 'questions'
        ? api.post(isCsv ? '/questions/import/csv' : '/questions/import/excel', form, {
            headers: { 'Content-Type': 'multipart/form-data' },
          })
        : api.post(isCsv ? '/exams/import/csv' : '/exams/import/excel', form, {
            headers: { 'Content-Type': 'multipart/form-data' },
          }))

      setMessage(res.data?.message ?? 'Import completed.')
      if (res.data?.errors?.length) {
        setError(`Import completed with errors: ${res.data.errors.slice(0, 5).join(' | ')}${res.data.errors.length > 5 ? ' ...' : ''}`)
      }

      setQImportFile(null)
      setEImportFile(null)
      setIds('')
    } catch (e) {
      setError(getApiErrorMessage(e, 'Import failed.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold">Import / Export</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setTab('questions')}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              tab === 'questions'
                ? 'bg-indigo-600 text-white dark:bg-indigo-700'
                : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Questions
          </button>
          <button
            onClick={() => setTab('exams')}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              tab === 'exams'
                ? 'bg-indigo-600 text-white dark:bg-indigo-700'
                : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Exams
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h2 className="text-lg font-semibold mb-3">Export</h2>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Optional IDs (comma-separated)</label>
            <input
              value={ids}
              onChange={(e) => setIds(e.target.value)}
              placeholder={tab === 'questions' ? 'e.g. 1,2,3' : 'e.g. 1,5,9'}
              className="mb-4 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            />

            <div className="flex flex-col gap-2">
              <button
                onClick={handleExport}
                disabled={loading}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {loading ? 'Exporting...' : 'Export CSV'}
              </button>
              <button
                onClick={handleExportExcel}
                disabled={loading}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {loading ? 'Exporting...' : 'Export Excel (.xlsx)'}
              </button>
            </div>

            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              If you leave IDs empty, the backend exports all records.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-3">Import</h2>
            {tab === 'questions' ? (
              <FilePicker
                label="Choose CSV/XLSX for questions"
                accept=".csv,.xlsx,.xls"
                onFileChange={setQImportFile}
              />
            ) : (
              <FilePicker
                label="Choose CSV/XLSX for exams"
                accept=".csv,.xlsx,.xls"
                onFileChange={setEImportFile}
              />
            )}

            <div className="mt-4 flex gap-2">
              <button
                onClick={handleImport}
                disabled={loading}
                className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {loading ? 'Importing...' : 'Import'}
              </button>
            </div>

            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              Import uses backend endpoints:
              {tab === 'questions' ? ' /questions/import/*' : ' /exams/import/*'}
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-6 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:bg-rose-950 dark:text-rose-200">
            {error}
          </div>
        )}
        {message && (
          <div className="mt-6 rounded-lg bg-indigo-50 px-4 py-3 text-sm text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200">
            {message}
          </div>
        )}
      </div>
    </div>
  )
}

