import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import Layout from '../components/Layout'

const EMPTY = {
  name: '', tagline: '', monthly_price: '', yearly_price: '',
  features: '', badge_text: '', display_order: '', active: true,
}

const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  )
}

export default function PricingEditPage() {
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
    supabase.from('pricing_plans').select('*').eq('id', id).single()
      .then(({ data, error }) => {
        if (error) { setMessage({ type: 'error', text: error.message }); setLoading(false); return }
        setForm({
          name: data.name ?? '',
          tagline: data.tagline ?? '',
          monthly_price: data.monthly_price ?? '',
          yearly_price: data.yearly_price ?? '',
          features: (data.features ?? []).join('\n'),
          badge_text: data.badge_text ?? '',
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
      name: form.name.trim(),
      tagline: form.tagline.trim(),
      monthly_price: parseFloat(form.monthly_price) || 0,
      yearly_price: form.yearly_price !== '' ? parseFloat(form.yearly_price) : null,
      features: form.features.split('\n').map(f => f.trim()).filter(Boolean),
      badge_text: form.badge_text.trim() || null,
      display_order: parseInt(form.display_order) || 0,
      active: form.active,
    }

    const { error } = isNew
      ? await supabase.from('pricing_plans').insert(payload)
      : await supabase.from('pricing_plans').update(payload).eq('id', id)

    setSaving(false)
    if (error) { setMessage({ type: 'error', text: error.message }); return }
    if (isNew) navigate('/pricing', { replace: true })
    else setMessage({ type: 'success', text: 'Saved successfully.' })
  }

  async function handleDelete() {
    if (!window.confirm(`Delete "${form.name}"?`)) return
    setDeleting(true)
    const { error } = await supabase.from('pricing_plans').delete().eq('id', id)
    if (error) { setMessage({ type: 'error', text: error.message }); setDeleting(false); return }
    navigate('/pricing', { replace: true })
  }

  if (loading) return <Layout><p className="text-gray-500 text-sm">Loading…</p></Layout>

  return (
    <Layout>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/pricing')} className="text-blue-600 hover:underline text-sm">← Back</button>
        <h2 className="text-xl font-bold text-gray-800">{isNew ? 'New Pricing Plan' : 'Edit Pricing Plan'}</h2>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white rounded-xl shadow p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Plan name *">
              <input type="text" required value={form.name} onChange={e => set('name', e.target.value)} className={inputCls} />
            </Field>
            <Field label="Tagline (shown under name)">
              <input type="text" value={form.tagline} onChange={e => set('tagline', e.target.value)} className={inputCls} />
            </Field>
            <Field label="Monthly price ($) *">
              <input type="number" step="0.01" min="0" required value={form.monthly_price} onChange={e => set('monthly_price', e.target.value)} className={inputCls} />
            </Field>
            <Field label="Yearly price ($) — leave blank for no yearly option">
              <input type="number" step="0.01" min="0" value={form.yearly_price} onChange={e => set('yearly_price', e.target.value)} className={inputCls} />
            </Field>
            <Field label="Badge text (e.g. Most Popular) — leave blank for none">
              <input type="text" value={form.badge_text} onChange={e => set('badge_text', e.target.value)} className={inputCls} />
            </Field>
            <Field label="Display order">
              <input type="number" min="1" value={form.display_order} onChange={e => set('display_order', e.target.value)} className={inputCls} />
            </Field>
          </div>

          <Field label="Features — one per line">
            <textarea rows={8} value={form.features} onChange={e => set('features', e.target.value)} className={inputCls} placeholder="Unlimited access to the facility&#10;Unlimited group fitness classes" />
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
              {deleting ? 'Deleting…' : 'Delete plan'}
            </button>
          )}
        </div>
      </form>
    </Layout>
  )
}
