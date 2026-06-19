import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import Layout from '../components/Layout'

const EMPTY = { question: '', answer: '', display_order: '', active: true }
const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  )
}

export default function FaqEditPage() {
  const { id } = useParams()
  const isNew = id === undefined
  const navigate = useNavigate()

  const [form, setForm] = useState(EMPTY)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    if (isNew) return
    supabase.from('faqs').select('*').eq('id', id).single()
      .then(({ data, error }) => {
        if (error) { setMessage({ type: 'error', text: error.message }); setLoading(false); return }
        setForm({
          question: data.question ?? '',
          answer: data.answer ?? '',
          display_order: data.display_order ?? '',
          active: data.active ?? true,
        })
        setLoading(false)
      })
  }, [id, isNew])

  function set(f, v) { setForm(p => ({ ...p, [f]: v })) }

  async function handleSave(e) {
    e.preventDefault()
    setMessage({ type: '', text: '' })
    setSaving(true)

    const payload = {
      question: form.question.trim(),
      answer: form.answer.trim(),
      display_order: parseInt(form.display_order) || 0,
      active: form.active,
    }

    const { error } = isNew
      ? await supabase.from('faqs').insert(payload)
      : await supabase.from('faqs').update(payload).eq('id', id)

    setSaving(false)
    if (error) { setMessage({ type: 'error', text: error.message }); return }
    if (isNew) navigate('/faq', { replace: true })
    else setMessage({ type: 'success', text: 'Saved successfully.' })
  }

  async function handleDelete() {
    if (!window.confirm('Delete this FAQ entry?')) return
    setDeleting(true)
    const { error } = await supabase.from('faqs').delete().eq('id', id)
    if (error) { setMessage({ type: 'error', text: error.message }); setDeleting(false); return }
    navigate('/faq', { replace: true })
  }

  if (loading) return <Layout><p className="text-gray-500 text-sm">Loading…</p></Layout>

  return (
    <Layout>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/faq')} className="text-blue-600 hover:underline text-sm">← Back</button>
        <h2 className="text-xl font-bold text-gray-800">{isNew ? 'New FAQ Entry' : 'Edit FAQ Entry'}</h2>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white rounded-xl shadow p-6 space-y-4">
          <Field label="Question *">
            <input type="text" required value={form.question} onChange={e => set('question', e.target.value)} className={inputCls} />
          </Field>
          <Field label="Answer *">
            <textarea rows={5} required value={form.answer} onChange={e => set('answer', e.target.value)} className={inputCls} />
          </Field>
          <Field label="Display order">
            <input type="number" min="1" value={form.display_order} onChange={e => set('display_order', e.target.value)} className={`${inputCls} max-w-xs`} />
          </Field>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={form.active} onChange={e => set('active', e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-blue-600" />
            <span className="text-sm text-gray-700">Active (visible on public site)</span>
          </label>
        </div>

        {message.text && (
          <p className={`text-sm px-4 py-3 rounded-lg border ${message.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
            {message.text}
          </p>
        )}

        <div className="flex items-center justify-between">
          <button type="submit" disabled={saving} className="bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white text-sm font-medium px-6 py-2 rounded-lg transition">
            {saving ? 'Saving…' : 'Save'}
          </button>
          {!isNew && (
            <button type="button" onClick={handleDelete} disabled={deleting} className="text-red-600 hover:underline text-sm disabled:opacity-50">
              {deleting ? 'Deleting…' : 'Delete question'}
            </button>
          )}
        </div>
      </form>
    </Layout>
  )
}
