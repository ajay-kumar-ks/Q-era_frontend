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
        {duplicateInfo?.reason && (
          <p className="mt-1 text-sm text-slate-500 italic">"{duplicateInfo.reason}"</p>
        )}
        {!!duplicateInfo?.similar_ids?.length && (
          <p className="mt-1 text-sm text-slate-500">Similar question IDs: {duplicateInfo.similar_ids.join(', ')}</p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="rounded-lg border border-slate-300 px-4 py-2 text-sm">
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Override &amp; Submit
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
  const [aiLoading, setAiLoading] = useState(false)
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

  // Step validation
  // For MCQ, correct_answer is set by clicking a radio in step 2 — not required on step 1
  const step1Valid = form.title.trim().length >= 5 && (isMCQ || form.correct_answer.trim().length > 0)
  const step2Valid = !isMCQ || (
    form.options.filter((o) => o.option_text.trim()).length >= 2 &&
    form.correct_answer.trim().length > 0
  )

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
      options: [
        ...prev.options,
        { option_text: '', option_order: prev.options.length + 1, image_url: '' },
      ],
    }))
  }

  const removeOption = (index) => {
    setForm((prev) => {
      const next = prev.options
        .filter((_, idx) => idx !== index)
        .map((opt, idx) => ({ ...opt, option_order: idx + 1 }))
      return { ...prev, options: next.length ? next : [{ option_text: '', option_order: 1, image_url: '' }] }
    })
  }

  const addTag = () => {
    const value = tagInput.trim().toLowerCase()
    if (!value || form.tags.includes(value)) return
    updateForm('tags', [...form.tags, value])
    setTagInput('')
  }

  const handleTagInputKey = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
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

  const buildPayload = (currentForm = form) => ({
    title: currentForm.title.trim(),
    description: currentForm.description.trim() || null,
    type: currentForm.type,
    correct_answer: currentForm.correct_answer.trim(),
    difficulty: currentForm.difficulty || null,
    explanation: currentForm.explanation.trim() || null,
    image_url: currentForm.image_url.trim() || null,
    media_url: currentForm.media_url.trim() || null,
    attachment_url: currentForm.attachment_url.trim() || null,
    is_public: currentForm.is_public,
    tags: currentForm.tags,
    options:
      currentForm.type === 'mcq'
        ? currentForm.options
            .filter((o) => o.option_text.trim())
            .map((o, idx) => ({
              option_text: o.option_text.trim(),
              option_order: idx + 1,
              image_url: o.image_url?.trim() || null,
            }))
        : [],
  })

  const submitQuestion = async (payload) => {
    setSubmitting(true)
    setError('')
    setSuccess('')
    try {
      const { data } = await api.post('/questions/', payload)
      setSuccess('Question created successfully.')
      navigate(`/questions/${data.id}`)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create question.')
    } finally {
      setSubmitting(false)
    }
  }

  // Called when user clicks "Create question" on step 3
  const handleSubmit = async () => {
    setError('')
    setAiLoading(true)

    // Work with a mutable snapshot so we can update difficulty/tags before submitting
    let currentForm = { ...form }

    // 1. AI difficulty suggestion if user left it blank
    if (!currentForm.difficulty) {
      try {
        const { data } = await api.post('/ai/analyze-difficulty', {
          title: currentForm.title.trim(),
          description: currentForm.description.trim() || null,
        })
        const suggested = data?.difficulty || 'medium'
        currentForm = { ...currentForm, difficulty: suggested }
        // Also update visible form state so user can see what was picked
        setForm((prev) => ({ ...prev, difficulty: suggested }))
      } catch {
        currentForm = { ...currentForm, difficulty: 'medium' }
        setForm((prev) => ({ ...prev, difficulty: 'medium' }))
      }
    }

    // 2. AI tag suggestion if user added no tags
    if (!currentForm.tags.length) {
      try {
        const { data } = await api.post('/ai/suggest-tags', {
          title: currentForm.title.trim(),
          description: currentForm.description.trim() || null,
        })
        const suggested = Array.isArray(data?.tags) ? data.tags : []
        currentForm = { ...currentForm, tags: suggested }
        // Show the suggested tags in the UI
        setForm((prev) => ({ ...prev, tags: suggested }))
      } catch {
        // leave empty
      }
    }

    setAiLoading(false)

    const payload = buildPayload(currentForm)

    // 3. AI duplicate check
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
      // fail-open: proceed if AI check errors
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

  const goNext = () => {
    if (step === 1 && !step1Valid) return
    if (step === 2 && !step2Valid) return
    setStep((s) => Math.min(3, s + 1))
  }

  const goBack = () => setStep((s) => Math.max(1, s - 1))

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-bold text-slate-900">Create Question</h1>
      <p className="mt-2 text-sm text-slate-600">Step {step} of 3</p>

      {/* NOT a <form> — avoids all browser native submit/validation issues */}
      <div className="mt-6 space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

        {/* ── Step 1: Core question details ── */}
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
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Title <span className="text-rose-500">*</span>
              </label>
              <input
                value={form.title}
                onChange={(e) => updateForm('title', e.target.value)}
                minLength={5}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
              {form.title.trim().length > 0 && form.title.trim().length < 5 && (
                <p className="mt-1 text-xs text-rose-500">Minimum 5 characters</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => updateForm('description', e.target.value)}
                rows={4}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {['image_url', 'media_url', 'attachment_url'].map((field) => {
                const labels = { image_url: 'Question image', media_url: 'Media', attachment_url: 'Attachment' }
                const placeholders = { image_url: 'https://...', media_url: 'Video/audio link', attachment_url: 'PDF or file link' }
                const uploaded_labels = { image_url: 'Image uploaded', media_url: 'Media uploaded', attachment_url: 'Attachment uploaded' }
                return (
                  <div key={field}>
                    <label className="block text-sm font-medium text-slate-700">{labels[field]}</label>
                    {uploadedFields[field] ? (
                      <div className="mt-1 flex items-center gap-3 rounded-lg border border-slate-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                        <span>{uploaded_labels[field]}</span>
                        <button
                          type="button"
                          onClick={() => clearUploadedField(field)}
                          className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-rose-700 shadow-sm hover:bg-rose-50"
                        >×</button>
                      </div>
                    ) : (
                      <input
                        value={form[field]}
                        onChange={(e) => updateForm(field, e.target.value)}
                        placeholder={placeholders[field]}
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                      />
                    )}
                  </div>
                )
              })}
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
                  {uploadError && <p className="mt-2 text-sm text-rose-600">{uploadError}</p>}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Correct answer <span className="text-rose-500">*</span>
                {isMCQ && <span className="ml-1 text-xs font-normal text-slate-400">(select from options in next step)</span>}
              </label>
              {isMCQ ? (
                <p className="mt-1 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-400">
                  {form.correct_answer ? (
                    <span className="text-emerald-700 font-medium">✓ &quot;{form.correct_answer}&quot; selected as correct</span>
                  ) : (
                    'You\'ll mark the correct option in the next step →'
                  )}
                </p>
              ) : (
                <input
                  value={form.correct_answer}
                  onChange={(e) => updateForm('correct_answer', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              )}
            </div>
          </>
        )}

        {/* ── Step 2: Options ── */}
        {step === 2 && (
          <>
            {isMCQ ? (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  Options
                  <span className="ml-1 text-xs font-normal text-slate-400">(at least 2 · click the circle to mark correct)</span>
                </label>
                {form.options.map((opt, idx) => {
                  const isCorrect = form.correct_answer === opt.option_text && opt.option_text.trim() !== ''
                  return (
                    <div
                      key={idx}
                      className={`flex items-start gap-3 rounded-xl border p-3 transition-colors ${
                        isCorrect
                          ? 'border-emerald-300 bg-emerald-50'
                          : 'border-slate-100 bg-slate-50'
                      }`}
                    >
                      {/* Correct-answer radio */}
                      <button
                        type="button"
                        title="Mark as correct answer"
                        onClick={() => {
                          if (opt.option_text.trim()) updateForm('correct_answer', opt.option_text.trim())
                        }}
                        className={`mt-2.5 h-4 w-4 flex-shrink-0 rounded-full border-2 transition-colors ${
                          isCorrect
                            ? 'border-emerald-500 bg-emerald-500'
                            : 'border-slate-400 bg-white hover:border-emerald-400'
                        }`}
                      >
                        {isCorrect && (
                          <span className="flex h-full w-full items-center justify-center">
                            <span className="h-1.5 w-1.5 rounded-full bg-white" />
                          </span>
                        )}
                      </button>

                      <div className="flex flex-1 flex-col gap-2 sm:flex-row">
                        <input
                          value={opt.option_text}
                          onChange={(e) => {
                            updateOption(idx, e.target.value)
                            // Keep correct_answer in sync if this option was the selected one
                            if (isCorrect) updateForm('correct_answer', e.target.value)
                          }}
                          placeholder={`Option ${idx + 1}`}
                          aria-label={`Option ${idx + 1} text`}
                          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                        />
                        <input
                          value={opt.image_url || ''}
                          onChange={(e) => updateOptionImage(idx, e.target.value)}
                          placeholder="Optional image URL"
                          aria-label={`Option ${idx + 1} image URL`}
                          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (isCorrect) updateForm('correct_answer', '')
                          removeOption(idx)
                        }}
                        className="mt-2 rounded-lg border border-slate-300 px-2 py-1 text-xs hover:bg-white"
                      >
                        ✕
                      </button>
                    </div>
                  )
                })}

                <button type="button" onClick={addOption} className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs hover:bg-slate-200">
                  + Add option
                </button>

                {!step2Valid && form.options.filter((o) => o.option_text.trim()).length >= 2 && (
                  <p className="text-xs text-amber-600">⚠ Click the circle next to the correct option to mark it.</p>
                )}
                {!step2Valid && form.options.filter((o) => o.option_text.trim()).length < 2 && (
                  <p className="text-xs text-rose-500">At least 2 options required</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No options required for this question type.</p>
            )}
          </>
        )}

        {/* ── Step 3: Metadata ── */}
        {step === 3 && (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-700">Difficulty</label>
              <select
                value={form.difficulty}
                onChange={(e) => updateForm('difficulty', e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">Auto (AI will suggest)</option>
                {DIFFICULTY_TYPES.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              {form.difficulty && (
                <p className="mt-1 text-xs text-indigo-600">
                  ✦ AI suggested: <strong>{form.difficulty}</strong>
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Explanation (optional)</label>
              <textarea
                value={form.explanation}
                onChange={(e) => updateForm('explanation', e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Tags
                <span className="ml-1 text-xs font-normal text-slate-400">(AI will suggest if left empty)</span>
              </label>
              <div className="mt-1 flex gap-2">
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagInputKey}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  placeholder="Type a tag and press Enter or Add"
                />
                <button type="button" onClick={addTag} className="rounded-lg bg-slate-100 px-3 py-2 text-xs">
                  Add
                </button>
              </div>
              {form.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {form.tags.map((tag) => (
                    <button
                      type="button"
                      key={tag}
                      onClick={() => removeTag(tag)}
                      className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs text-emerald-700 hover:bg-emerald-100"
                    >
                      #{tag} ×
                    </button>
                  ))}
                </div>
              )}
            </div>

            <label className="inline-flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_public}
                onChange={(e) => updateForm('is_public', e.target.checked)}
              />
              Public question
            </label>

            {aiLoading && (
              <div className="flex items-center gap-2 rounded-lg bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                AI is analysing your question…
              </div>
            )}
          </>
        )}

        {error && <p className="text-sm text-rose-600">{error}</p>}
        {success && <p className="text-sm text-emerald-600">{success}</p>}

        {/* Navigation */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={goBack}
            disabled={step === 1}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm disabled:opacity-40"
          >
            Back
          </button>

          {step < 3 ? (
            <button
              type="button"
              onClick={goNext}
              disabled={(step === 1 && !step1Valid) || (step === 2 && !step2Valid)}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40 hover:bg-indigo-700"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || aiLoading}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40 hover:bg-indigo-700"
            >
              {aiLoading ? 'Getting AI suggestions…' : submitting ? 'Submitting…' : 'Create question'}
            </button>
          )}
        </div>
      </div>

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
