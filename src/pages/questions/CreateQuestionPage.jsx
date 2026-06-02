import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'

const QUESTION_TYPES = ['mcq', 'true_false', 'short_answer', 'descriptive']
const DIFFICULTY_TYPES = ['easy', 'medium', 'hard']

function SimilarQuestionModal({ open, duplicateInfo, onCancel, onConfirm }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-slate-900">Possible duplicate detected</h3>
        <p className="mt-2 text-sm text-slate-600">
          Similarity confidence: <strong>{Math.round((duplicateInfo?.confidence || 0) * 100)}%</strong>
        </p>
        {!!duplicateInfo?.similar_ids?.length && (
          <p className="mt-1 text-sm text-slate-500">Similar question IDs: {duplicateInfo.similar_ids.join(', ')}</p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Override & Submit
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CreateQuestionPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showDuplicateModal, setShowDuplicateModal] = useState(false)
  const [pendingPayload, setPendingPayload] = useState(null)
  const [duplicateInfo, setDuplicateInfo] = useState(null)
  const [tagInput, setTagInput] = useState('')
  const [uploadTarget, setUploadTarget] = useState('image_url')
  const [selectedUploadFile, setSelectedUploadFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploadedFields, setUploadedFields] = useState({
    image_url: false,
    media_url: false,
    attachment_url: false,
  })
  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'mcq',
    correct_answer: '',
    difficulty: '',
    explanation: '',
    image_url: '',
    media_url: '',
    attachment_url: '',
    is_public: true,
    tags: [],
    options: [
      { option_text: '', option_order: 1, image_url: '' },
      { option_text: '', option_order: 2, image_url: '' },
    ],
  })

  const isMCQ = form.type === 'mcq'
  const canGoStep2 = form.title.trim().length >= 5 && form.correct_answer.trim().length > 0
  const canGoStep3 = !isMCQ || form.options.filter((o) => o.option_text.trim()).length >= 2

  const localDuplicateHint = useMemo(() => {
    const base = form.title.trim().toLowerCase()
    if (!base) return null
    return null
  }, [form.title])

  const updateForm = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (['image_url', 'media_url', 'attachment_url'].includes(field) && !value) {
      setUploadedFields((prev) => ({ ...prev, [field]: false }))
    }
  }

  const clearUploadedField = (field) => {
    setForm((prev) => ({ ...prev, [field]: '' }))
    setUploadedFields((prev) => ({ ...prev, [field]: false }))
  }

  const updateOption = (index, value) => {
    setForm((prev) => {
      const next = [...prev.options]
      next[index] = { ...next[index], option_text: value }
      return { ...prev, options: next }
    })
  }

  const updateOptionImage = (index, value) => {
    setForm((prev) => {
      const next = [...prev.options]
      next[index] = { ...next[index], image_url: value }
      return { ...prev, options: next }
    })
  }

  const addOption = () => {
    setForm((prev) => ({
      ...prev,
      options: [...prev.options, { option_text: '', option_order: prev.options.length + 1, image_url: '' }],
    }))
  }

  const removeOption = (index) => {
    setForm((prev) => {
      const next = prev.options.filter((_, idx) => idx !== index).map((opt, idx) => ({
        ...opt,
        option_order: idx + 1,
      }))
      return { ...prev, options: next.length ? next : [{ option_text: '', option_order: 1, image_url: '' }]}
    })
  }

  const addTag = () => {
    const value = tagInput.trim().toLowerCase()
    if (!value || form.tags.includes(value)) return
    updateForm('tags', [...form.tags, value])
    setTagInput('')
  }

  const removeTag = (tag) => updateForm('tags', form.tags.filter((t) => t !== tag))

  const uploadMediaFile = async () => {
    if (!selectedUploadFile) {
      setUploadError('Please select a file to upload.')
      return
    }
    setUploading(true)
    setUploadError('')
    try {
      const formData = new FormData()
      formData.append('file', selectedUploadFile)
      const { data } = await api.post('/questions/upload-media', formData)
      updateForm(uploadTarget, data.url)
      setUploadedFields((prev) => ({ ...prev, [uploadTarget]: true }))
      setSelectedUploadFile(null)
      setSuccess('File uploaded successfully.')
    } catch (err) {
      setUploadError(err.response?.data?.detail || 'Upload failed. Please check your Cloudinary settings.')
    } finally {
      setUploading(false)
    }
  }

  const buildPayload = () => ({
    title: form.title.trim(),
    description: form.description.trim() || null,
    type: form.type,
    correct_answer: form.correct_answer.trim(),
    difficulty: form.difficulty || null,
    explanation: form.explanation.trim() || null,
    image_url: form.image_url.trim() || null,
    media_url: form.media_url.trim() || null,
    attachment_url: form.attachment_url.trim() || null,
    is_public: form.is_public,
    tags: form.tags,
    options: isMCQ
      ? form.options
          .filter((o) => o.option_text.trim())
          .map((o, idx) => ({ option_text: o.option_text.trim(), option_order: idx + 1, image_url: o.image_url?.trim() || null }))
      : [],
  })

  const submitQuestion = async (payload) => {
    setSubmitting(true)
    setError('')
    setSuccess('')
    try {
      const { data } = await api.post('/questions/', payload)
      setSuccess('Question created successfully.')
      if (data?.duplicate_warning) {
        setDuplicateInfo(data.duplicate_warning)
      }
      navigate(`/questions/${data.id}`)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create question.')
    } finally {
      setSubmitting(false)
    }
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    const payload = buildPayload()

    if (!payload.difficulty) {
      try {
        const { data } = await api.post('/ai/analyze-difficulty', {
          title: payload.title,
          description: payload.description,
        })
        payload.difficulty = data?.difficulty || 'medium'
      } catch {
        payload.difficulty = 'medium'
      }
    }

    if (!payload.tags.length) {
      try {
        const { data } = await api.post('/ai/suggest-tags', {
          title: payload.title,
          description: payload.description,
        })
        payload.tags = Array.isArray(data?.tags) ? data.tags : []
      } catch {
        payload.tags = []
      }
    }

    try {
      const { data } = await api.post('/ai/check-duplicate', {
        title: payload.title,
        description: payload.description,
      })
      if (data?.is_duplicate) {
        setPendingPayload(payload)
        setDuplicateInfo(data)
        setShowDuplicateModal(true)
        return
      }
    } catch {
      if (localDuplicateHint) {
        setPendingPayload(payload)
        setDuplicateInfo({ is_duplicate: true, confidence: 0.6, similar_ids: [] })
        setShowDuplicateModal(true)
        return
      }
    }

    await submitQuestion(payload)
  }

  const confirmDuplicateSubmit = async () => {
    setShowDuplicateModal(false)
    if (pendingPayload) {
      await submitQuestion(pendingPayload)
      setPendingPayload(null)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-bold text-slate-900">Create Question</h1>
      <p className="mt-2 text-sm text-slate-600">Step {step} of 3</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {step === 1 && (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-700">Question type</label>
              <select
                value={form.type}
                onChange={(e) => updateForm('type', e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                {QUESTION_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Title</label>
              <input
                value={form.title}
                onChange={(e) => updateForm('title', e.target.value)}
                minLength={5}
                required
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => updateForm('description', e.target.value)}
                rows={4}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-slate-700">Question image</label>
                {uploadedFields.image_url ? (
                  <div className="mt-1 flex items-center gap-3 rounded-lg border border-slate-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                    <span>Image uploaded</span>
                    <button
                      type="button"
                      onClick={() => clearUploadedField('image_url')}
                      className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-rose-700 shadow-sm hover:bg-rose-50"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <input
                    value={form.image_url}
                    onChange={(e) => updateForm('image_url', e.target.value)}
                    placeholder="https://..."
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Media</label>
                {uploadedFields.media_url ? (
                  <div className="mt-1 flex items-center gap-3 rounded-lg border border-slate-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                    <span>Media uploaded</span>
                    <button
                      type="button"
                      onClick={() => clearUploadedField('media_url')}
                      className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-rose-700 shadow-sm hover:bg-rose-50"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <input
                    value={form.media_url}
                    onChange={(e) => updateForm('media_url', e.target.value)}
                    placeholder="Video/audio link"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Attachment</label>
                {uploadedFields.attachment_url ? (
                  <div className="mt-1 flex items-center gap-3 rounded-lg border border-slate-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                    <span>Attachment uploaded</span>
                    <button
                      type="button"
                      onClick={() => clearUploadedField('attachment_url')}
                      className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-rose-700 shadow-sm hover:bg-rose-50"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <input
                    value={form.attachment_url}
                    onChange={(e) => updateForm('attachment_url', e.target.value)}
                    placeholder="PDF or file link"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                )}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Upload target</label>
                  <select
                    value={uploadTarget}
                    onChange={(e) => setUploadTarget(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="image_url">Question image</option>
                    <option value="media_url">Media file</option>
                    <option value="attachment_url">Attachment</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700">Upload file to Cloudinary</label>
                  <div className="mt-1 flex gap-2">
                    <input
                      type="file"
                      accept="image/*,video/*,audio/*,.pdf"
                      onChange={(e) => setSelectedUploadFile(e.target.files?.[0] ?? null)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                    />
                    <button
                      type="button"
                      onClick={uploadMediaFile}
                      disabled={uploading}
                      className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-40"
                    >
                      {uploading ? 'Uploading…' : 'Upload'}
                    </button>
                  </div>
                  {uploadError ? <p className="mt-2 text-sm text-rose-600">{uploadError}</p> : null}
                  <p className="mt-2 text-sm text-slate-500">Uploaded files will be stored in Cloudinary and the resulting URL will populate the selected field.</p>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Correct answer</label>
              <input
                value={form.correct_answer}
                onChange={(e) => updateForm('correct_answer', e.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </>
        )}

        {step === 2 && (
          <>
            {isMCQ ? (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Options</label>
                {form.options.map((opt, idx) => (
                  <div key={idx} className="grid gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3 sm:grid-cols-[1fr_1fr_auto]">
                    <input
                      value={opt.option_text}
                      onChange={(e) => updateOption(idx, e.target.value)}
                      placeholder={`Option ${idx + 1}`}
                      aria-label={`Option ${idx + 1} text`}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    />
                    <input
                      value={opt.image_url || ''}
                      onChange={(e) => updateOptionImage(idx, e.target.value)}
                      placeholder="Optional option image URL"
                      aria-label={`Option ${idx + 1} image URL`}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeOption(idx)}
                      className="rounded-lg border border-slate-300 px-3 text-xs hover:bg-white"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button type="button" onClick={addOption} className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs">
                  + Add option
                </button>
              </div>
            ) : (
              <p className="text-sm text-slate-500">No options required for this question type.</p>
            )}
          </>
        )}

        {step === 3 && (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-700">Difficulty (optional)</label>
              <select
                value={form.difficulty}
                onChange={(e) => updateForm('difficulty', e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">Auto (AI suggestion)</option>
                {DIFFICULTY_TYPES.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Explanation (optional)</label>
              <textarea
                value={form.explanation}
                onChange={(e) => updateForm('explanation', e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Tags (optional)</label>
              <div className="mt-1 flex gap-2">
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  placeholder="Add tag"
                />
                <button type="button" onClick={addTag} className="rounded-lg bg-slate-100 px-3 py-2 text-xs">
                  Add
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {form.tags.map((tag) => (
                  <button
                    type="button"
                    key={tag}
                    onClick={() => removeTag(tag)}
                    className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs text-emerald-700"
                  >
                    #{tag} ×
                  </button>
                ))}
              </div>
            </div>

            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.is_public}
                onChange={(e) => updateForm('is_public', e.target.checked)}
              />
              Public question
            </label>
          </>
        )}

        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        {success ? <p className="text-sm text-emerald-600">{success}</p> : null}

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm disabled:opacity-40"
          >
            Back
          </button>
          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              disabled={(step === 1 && !canGoStep2) || (step === 2 && !canGoStep3)}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
            >
              Next
            </button>
          ) : (
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
            >
              {submitting ? 'Submitting...' : 'Create question'}
            </button>
          )}
        </div>
      </form>

      <SimilarQuestionModal
        open={showDuplicateModal}
        duplicateInfo={duplicateInfo}
        onCancel={() => {
          setShowDuplicateModal(false)
          setPendingPayload(null)
        }}
        onConfirm={confirmDuplicateSubmit}
      />
    </div>
  )
}
