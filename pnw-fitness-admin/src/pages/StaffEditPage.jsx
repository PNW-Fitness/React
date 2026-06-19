import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import Layout from '../components/Layout'

const ROLES = [
  { key: 'personal_trainer', label: 'Personal Trainer (PT)' },
  { key: 'group_instructor', label: 'Group Instructor (GI)' },
]

const EMPTY_FORM = {
  name: '',
  initial: '',
  cert: '',
  specialty: '',
  bio: '',
  tags: '',
  active: true,
}

const EMPTY_ROLE_STATE = {
  personal_trainer: { checked: false, display_order: '', classes_taught: '' },
  group_instructor: { checked: false, display_order: '', classes_taught: '' },
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_BYTES = 5 * 1024 * 1024 // 5 MB

export default function StaffEditPage() {
  const { id } = useParams()
  const isNew = id === undefined
  const navigate = useNavigate()
  const fileRef = useRef(null)

  const [form, setForm] = useState(EMPTY_FORM)
  const [roles, setRoles] = useState(EMPTY_ROLE_STATE)
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState(null) // saved URL from DB
  const [photoFile, setPhotoFile] = useState(null)             // pending upload
  const [photoPreview, setPhotoPreview] = useState(null)       // object URL for preview
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    if (isNew) return
    async function load() {
      const { data, error } = await supabase
        .from('staff')
        .select('*, staff_roles(*)')
        .eq('id', id)
        .single()
      if (error) { setMessage({ type: 'error', text: error.message }); setLoading(false); return }

      setForm({
        name: data.name ?? '',
        initial: data.initial ?? '',
        cert: data.cert ?? '',
        specialty: data.specialty ?? '',
        bio: data.bio ?? '',
        tags: (data.tags ?? []).join(', '),
        active: data.active ?? true,
      })
      setCurrentPhotoUrl(data.photo_url ?? null)

      const roleState = { ...EMPTY_ROLE_STATE }
      for (const r of data.staff_roles ?? []) {
        if (roleState[r.role] !== undefined) {
          roleState[r.role] = {
            checked: true,
            display_order: r.display_order ?? '',
            classes_taught: (r.classes_taught ?? []).join(', '),
          }
        }
      }
      setRoles(roleState)
      setLoading(false)
    }
    load()
  }, [id, isNew])

  // Clean up object URL on unmount
  useEffect(() => () => { if (photoPreview) URL.revokeObjectURL(photoPreview) }, [photoPreview])

  function setField(field, value) { setForm(f => ({ ...f, [field]: value })) }
  function setRoleField(role, field, value) { setRoles(r => ({ ...r, [role]: { ...r[role], [field]: value } })) }

  function handlePhotoChange(e) {
    const file = e.target.files[0]
    if (!file) return
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setMessage({ type: 'error', text: 'Photo must be JPG, PNG, or WebP.' })
      return
    }
    if (file.size > MAX_BYTES) {
      setMessage({ type: 'error', text: 'Photo must be under 5 MB.' })
      return
    }
    setMessage({ type: '', text: '' })
    setPhotoFile(file)
    if (photoPreview) URL.revokeObjectURL(photoPreview)
    setPhotoPreview(URL.createObjectURL(file))
  }

  async function uploadPendingPhoto(staffId) {
    if (!photoFile) return currentPhotoUrl
    setUploading(true)
    const ext = photoFile.name.split('.').pop().toLowerCase()
    const path = `staff/${staffId}-${Date.now()}.${ext}`
    const { error: uploadErr } = await supabase.storage
      .from('staff-photos')
      .upload(path, photoFile, { upsert: true, contentType: photoFile.type })
    setUploading(false)
    if (uploadErr) throw uploadErr
    const { data } = supabase.storage.from('staff-photos').getPublicUrl(path)
    return data.publicUrl
  }

  async function handleSave(e) {
    e.preventDefault()
    setMessage({ type: '', text: '' })
    setSaving(true)

    let staffId = id

    // For new staff, insert first to get the ID, then upload photo using that ID
    if (isNew) {
      const { data, error } = await supabase
        .from('staff')
        .insert({
          name: form.name.trim(),
          initial: form.initial.trim() || null,
          cert: form.cert.trim() || null,
          specialty: form.specialty.trim() || null,
          bio: form.bio.trim() || null,
          tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
          active: form.active,
          photo_url: null,
        })
        .select('id')
        .single()
      if (error) { setMessage({ type: 'error', text: error.message }); setSaving(false); return }
      staffId = data.id
    }

    // Upload photo if a new file was selected
    let photoUrl = currentPhotoUrl
    try {
      photoUrl = await uploadPendingPhoto(staffId)
    } catch (err) {
      setMessage({ type: 'error', text: `Photo upload failed: ${err.message}` })
      if (isNew) await supabase.from('staff').delete().eq('id', staffId)
      setSaving(false)
      return
    }

    const staffPayload = {
      name: form.name.trim(),
      photo_url: photoUrl,
      initial: form.initial.trim() || null,
      cert: form.cert.trim() || null,
      specialty: form.specialty.trim() || null,
      bio: form.bio.trim() || null,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      active: form.active,
    }

    if (!isNew) {
      const { error } = await supabase.from('staff').update(staffPayload).eq('id', staffId)
      if (error) { setMessage({ type: 'error', text: error.message }); setSaving(false); return }
    } else {
      // Update the just-inserted row with the photo URL
      const { error } = await supabase.from('staff').update({ photo_url: photoUrl }).eq('id', staffId)
      if (error) { setMessage({ type: 'error', text: error.message }); setSaving(false); return }
    }

    // Save roles
    for (const roleKey of Object.keys(roles)) {
      const r = roles[roleKey]
      if (r.checked) {
        const { error } = await supabase.from('staff_roles').upsert(
          {
            staff_id: staffId,
            role: roleKey,
            display_order: parseInt(r.display_order) || null,
            classes_taught: r.classes_taught.split(',').map(c => c.trim()).filter(Boolean),
          },
          { onConflict: 'staff_id,role' }
        )
        if (error) { setMessage({ type: 'error', text: error.message }); setSaving(false); return }
      } else {
        await supabase.from('staff_roles').delete().eq('staff_id', staffId).eq('role', roleKey)
      }
    }

    setSaving(false)
    if (isNew) {
      navigate(`/staff/${staffId}`, { replace: true })
    } else {
      setCurrentPhotoUrl(photoUrl)
      setPhotoFile(null)
      setPhotoPreview(null)
      setMessage({ type: 'success', text: 'Saved successfully.' })
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Delete ${form.name}? This cannot be undone.`)) return
    setDeleting(true)
    const { error } = await supabase.from('staff').delete().eq('id', id)
    if (error) { setMessage({ type: 'error', text: error.message }); setDeleting(false); return }
    navigate('/', { replace: true })
  }

  if (loading) return <Layout><p className="text-gray-500 text-sm">Loading…</p></Layout>

  const displayPhoto = photoPreview ?? (currentPhotoUrl?.startsWith('http') ? currentPhotoUrl : null)

  return (
    <Layout>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/')} className="text-blue-600 hover:underline text-sm">← Back</button>
        <h2 className="text-xl font-bold text-gray-800">{isNew ? 'New Staff Member' : 'Edit Staff Member'}</h2>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white rounded-xl shadow p-6 space-y-4">
          <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Basic Info</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full Name *" required>
              <input type="text" required value={form.name} onChange={e => setField('name', e.target.value)} className={inputCls} />
            </Field>
            <Field label="Initial (fallback avatar letter)">
              <input type="text" maxLength={2} value={form.initial} onChange={e => setField('initial', e.target.value)} className={inputCls} />
            </Field>
            <Field label="Certification">
              <input type="text" value={form.cert} onChange={e => setField('cert', e.target.value)} className={inputCls} />
            </Field>
            <Field label="Specialty">
              <input type="text" value={form.specialty} onChange={e => setField('specialty', e.target.value)} className={inputCls} />
            </Field>
            <Field label="Tags (comma-separated)">
              <input type="text" value={form.tags} onChange={e => setField('tags', e.target.value)} placeholder="Strength, Mobility, HIIT" className={inputCls} />
            </Field>
          </div>

          <Field label="Bio">
            <textarea rows={4} value={form.bio} onChange={e => setField('bio', e.target.value)} className={inputCls} />
          </Field>

          {/* Photo upload */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Photo</label>
            <div className="flex items-start gap-4">
              {/* Preview */}
              <div
                className="w-24 h-24 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center"
                style={{ background: displayPhoto ? undefined : '#f3f4f6' }}
              >
                {displayPhoto ? (
                  <img src={displayPhoto} alt="Preview" className="w-full h-full object-cover object-top" />
                ) : (
                  <span className="text-3xl font-black text-gray-300">{form.initial || '?'}</span>
                )}
              </div>

              <div className="flex-1 space-y-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-3 py-2 rounded-lg transition"
                >
                  {currentPhotoUrl || photoFile ? 'Change photo' : 'Upload photo'}
                </button>
                {photoFile && (
                  <p className="text-xs text-blue-600">{photoFile.name} — will upload on Save</p>
                )}
                {!photoFile && currentPhotoUrl && (
                  <p className="text-xs text-gray-400 truncate max-w-xs">{currentPhotoUrl}</p>
                )}
                <p className="text-xs text-gray-400">JPG, PNG, or WebP · max 5 MB</p>
              </div>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={form.active} onChange={e => setField('active', e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-blue-600" />
            <span className="text-sm text-gray-700">Active (visible on public site)</span>
          </label>
        </div>

        <div className="bg-white rounded-xl shadow p-6 space-y-4">
          <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Roles</h3>
          {ROLES.map(({ key, label }) => (
            <div key={key} className="border border-gray-200 rounded-lg p-4">
              <label className="flex items-center gap-2 cursor-pointer select-none mb-3">
                <input type="checkbox" checked={roles[key].checked} onChange={e => setRoleField(key, 'checked', e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">{label}</span>
              </label>
              {roles[key].checked && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                  <Field label="Display order">
                    <input type="number" min={1} value={roles[key].display_order} onChange={e => setRoleField(key, 'display_order', e.target.value)} className={inputCls} />
                  </Field>
                  <Field label="Classes taught (comma-separated)">
                    <input type="text" value={roles[key].classes_taught} onChange={e => setRoleField(key, 'classes_taught', e.target.value)} placeholder="Spin, Yoga" className={inputCls} />
                  </Field>
                </div>
              )}
            </div>
          ))}
        </div>

        {message.text && (
          <p className={`text-sm px-4 py-3 rounded-lg border ${
            message.type === 'error'
              ? 'bg-red-50 text-red-700 border-red-200'
              : 'bg-green-50 text-green-700 border-green-200'
          }`}>
            {message.text}
          </p>
        )}

        <div className="flex items-center justify-between">
          <button
            type="submit"
            disabled={saving || uploading}
            className="bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white text-sm font-medium px-6 py-2 rounded-lg transition"
          >
            {uploading ? 'Uploading photo…' : saving ? 'Saving…' : 'Save'}
          </button>
          {!isNew && (
            <button type="button" onClick={handleDelete} disabled={deleting} className="text-red-600 hover:underline text-sm disabled:opacity-50">
              {deleting ? 'Deleting…' : 'Delete staff member'}
            </button>
          )}
        </div>
      </form>
    </Layout>
  )
}

const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}
