import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import Layout from '../components/Layout'

const EMPTY = { message: '', active: true, display_order: '' }
const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  )
}

export default function AnnouncementsEditPage() {
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
    supabase.from('announcements').select('*').eq('id', id).single()
      .then(({ data, error }) => {
        if (error) { setMessage({ type: 'error', text: error.message }); setLoading(false); return }
        setForm({
          message: data.message ?? '',
          active: data.active ?? true,
          display_order: data.display_order ?? '',
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
      message: form.message.trim(),
      active: form.active,
      display_order: parseInt(form.display_order) || 0,
      updated_at: new Date().toISOString(),
    }

    const { error } = isNew
      ? await supabase.from('announcements').insert(payload)
      : await supabase.from('announcements').update(payload).eq('id', id)

    setSaving(false)
    if (error) { setMessage({ type: 'error', text: error.message }); return }
    if (isNew) navigate('/announcements', { replace: true })
    else setMessage({ type: 'success', text: 'Saved successfully.' })
  }

  async function handleDelete() {
    if (!window.confirm('Delete this announcement?')) return
    setDeleting(true)
    const { error } = await supabase.from('announcements').delete().eq('id', id)
    if (error) { setMessage({ type: 'error', text: error.message }); setDeleting(false); return }
    navigate('/announcements', { replace: true })
  }

  if (loading) return <Layout><p className="text-gray-500 text-sm">Loading…</p></Layout>

  return (
    <Layout>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/announcements')} className="text-blue-600 hover:underline text-sm">← Back</button>
        <h2 className="text-xl font-bold text-gray-800">{isNew ? 'New Announcement' : 'Edit Announcement'}</h2>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white rounded-xl shadow p-6 space-y-4">
          <Field label="Message *">
            <textarea
              rows={4}
              required
              value={form.message}
              onChange={e => set('message', e.target.value)}
              placeholder="The text shown in the announcement banner…"
              className={inputCls}
            />
          </Field>
          <Field label="Display order">
            <input
              type="number"
              min="0"
              value={form.display_order}
              onChange={e => set('display_order', e.target.value)}
              className={`${inputCls} max-w-xs`}
            />
            <p className="text-xs text-gray-400 mt-1">Lower numbers appear first when multiple announcements are active.</p>
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
              {deleting ? 'Deleting…' : 'Delete announcement'}
            </button>
          )}
        </div>
      </form>
    </Layout>
  )
}
