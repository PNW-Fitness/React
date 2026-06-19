import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import Layout from '../components/Layout'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

const EMPTY = {
  year: new Date().getFullYear(),
  month: new Date().getMonth() + 1,
  day: new Date().getDate(),
  label: '',
  status: 'closed',
  open_time: '08:00',
  close_time: '20:00',
}

const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

function minsToTime(m) {
  if (m == null) return '08:00'
  return `${String(Math.floor(m / 60)).padStart(2,'0')}:${String(m % 60).padStart(2,'0')}`
}

function timeToMins(t) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  )
}

export default function HolidayEditPage() {
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
    supabase.from('holiday_hours').select('*').eq('id', id).single()
      .then(({ data, error }) => {
        if (error) { setMessage({ type: 'error', text: error.message }); setLoading(false); return }
        setForm({
          year: data.year,
          month: data.month,
          day: data.day,
          label: data.label ?? '',
          status: data.status,
          open_time: minsToTime(data.open_at_minutes),
          close_time: minsToTime(data.close_at_minutes),
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
      year: parseInt(form.year),
      month: parseInt(form.month),
      day: parseInt(form.day),
      label: form.label.trim(),
      status: form.status,
      open_at_minutes: form.status === 'custom' ? timeToMins(form.open_time) : null,
      close_at_minutes: form.status === 'custom' ? timeToMins(form.close_time) : null,
    }

    const { error } = isNew
      ? await supabase.from('holiday_hours').insert(payload)
      : await supabase.from('holiday_hours').update(payload).eq('id', id)

    setSaving(false)
    if (error) { setMessage({ type: 'error', text: error.message }); return }
    if (isNew) navigate('/holidays', { replace: true })
    else setMessage({ type: 'success', text: 'Saved successfully.' })
  }

  async function handleDelete() {
    if (!window.confirm(`Delete "${form.label}"?`)) return
    setDeleting(true)
    const { error } = await supabase.from('holiday_hours').delete().eq('id', id)
    if (error) { setMessage({ type: 'error', text: error.message }); setDeleting(false); return }
    navigate('/holidays', { replace: true })
  }

  if (loading) return <Layout><p className="text-gray-500 text-sm">Loading…</p></Layout>

  return (
    <Layout>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/holidays')} className="text-blue-600 hover:underline text-sm">← Back</button>
        <h2 className="text-xl font-bold text-gray-800">{isNew ? 'New Holiday' : 'Edit Holiday'}</h2>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white rounded-xl shadow p-6 space-y-4">
          <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Date &amp; Label</h3>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Year">
              <input type="number" required min="2024" max="2100" value={form.year} onChange={e => set('year', e.target.value)} className={inputCls} />
            </Field>
            <Field label="Month">
              <select value={form.month} onChange={e => set('month', e.target.value)} className={inputCls}>
                {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
            </Field>
            <Field label="Day">
              <input type="number" required min="1" max="31" value={form.day} onChange={e => set('day', e.target.value)} className={inputCls} />
            </Field>
          </div>
          <Field label="Label (shown in status card) *">
            <input type="text" required value={form.label} onChange={e => set('label', e.target.value)} className={inputCls} placeholder="e.g. Christmas Day" />
          </Field>
        </div>

        <div className="bg-white rounded-xl shadow p-6 space-y-4">
          <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Hours</h3>
          <div className="space-y-3">
            {[
              { value: 'closed',  label: 'Closed all day',  desc: 'Gym is closed — no access.' },
              { value: 'regular', label: 'Normal hours',    desc: 'Use regular weekday or weekend hours.' },
              { value: 'custom',  label: 'Custom hours',    desc: 'Specify open and close times.' },
            ].map(opt => (
              <label key={opt.value} className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value={opt.value}
                  checked={form.status === opt.value}
                  onChange={() => set('status', opt.value)}
                  className="mt-0.5 w-4 h-4 text-blue-600"
                />
                <div>
                  <div className="text-sm font-medium text-gray-700">{opt.label}</div>
                  <div className="text-xs text-gray-400">{opt.desc}</div>
                </div>
              </label>
            ))}
          </div>

          {form.status === 'custom' && (
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100 mt-2">
              <Field label="Open time">
                <input type="time" value={form.open_time} onChange={e => set('open_time', e.target.value)} className={inputCls} />
              </Field>
              <Field label="Close time">
                <input type="time" value={form.close_time} onChange={e => set('close_time', e.target.value)} className={inputCls} />
              </Field>
            </div>
          )}
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
              {deleting ? 'Deleting…' : 'Delete holiday'}
            </button>
          )}
        </div>
      </form>
    </Layout>
  )
}
