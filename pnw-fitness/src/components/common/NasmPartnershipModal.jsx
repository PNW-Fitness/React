import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

const inputStyle = {
  width: '100%',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '10px',
  padding: '13px 16px',
  color: '#fff',
  fontSize: '14px',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'Inter, sans-serif',
}

const labelStyle = {
  display: 'block',
  fontSize: '10px',
  fontWeight: 700,
  color: 'rgba(255,255,255,0.4)',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  marginBottom: '6px',
}

const EMPTY = {
  fullName: '', mailingAddress: '', email: '',
  phone: '', course: '', questions: '',
}

export default function NasmPartnershipModal({ onClose }) {
  const [form, setForm]     = useState(EMPTY)
  const [step, setStep]     = useState('form')
  const [errMsg, setErrMsg] = useState('')

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  const focus = e => (e.target.style.borderColor = '#2563EB')
  const blur  = e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')

  async function handleSubmit(e) {
    e.preventDefault()
    setErrMsg('')
    setStep('loading')

    const { data, error } = await supabase.from('lead_submissions').insert({
      source: 'nasm_partnership',
      name:   form.fullName.trim(),
      email:  form.email.trim(),
      phone:  form.phone.trim(),
      details: {
        mailing_address: form.mailingAddress.trim(),
        course:          form.course.trim(),
        questions:       form.questions.trim() || null,
      },
    }).select('id').single()

    if (error) {
      setErrMsg(error.message)
      setStep('error')
      return
    }

    // TODO: uncomment to enable Resend email notifications
    // supabase.functions.invoke('notify-lead', { body: { lead_id: data.id } }).catch(() => {})

    setStep('done')
  }

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.82)',
        backdropFilter: 'blur(8px)',
        zIndex: 9000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        style={{
          background: '#141414',
          border: '1px solid rgba(37,99,235,0.25)',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '480px',
          maxHeight: '90vh',
          overflowY: 'auto',
          position: 'relative',
        }}
      >
        <div style={{ height: '4px', background: '#2563EB', borderRadius: '24px 24px 0 0' }} />

        <div style={{ padding: '36px 40px 40px' }}>
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: '16px', right: '20px',
              background: 'none', border: 'none',
              color: 'rgba(255,255,255,0.4)', fontSize: '24px',
              cursor: 'pointer', lineHeight: 1,
            }}
          >
            ×
          </button>

          {step === 'done' ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '28px', color: '#fff', fontWeight: 800 }}>
                ✓
              </div>
              <h3 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '32px', fontWeight: 900, textTransform: 'uppercase', color: '#fff', margin: '0 0 12px' }}>
                Enrollment Submitted!
              </h3>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.7 }}>
                We'll follow up within 24 hours to confirm your course enrollment and next steps.
              </p>
              <button onClick={onClose} style={{ marginTop: '24px', padding: '12px 32px', background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(37,99,235,0.3)', borderRadius: '50px', color: '#2563EB', fontWeight: 700, fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}>
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#2563EB', marginBottom: '8px' }}>
                NASM Certification
              </div>
              <h2 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '34px', fontWeight: 900, textTransform: 'uppercase', color: '#fff', margin: '0 0 6px' }}>
                Enroll in a Course
              </h2>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '28px', lineHeight: 1.6 }}>
                Register for NASM certification through PNW Fitness, the only NASM-Approved Facility in Capitol Hill.
              </p>

              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Full Name *</label>
                <input style={inputStyle} type="text" required value={form.fullName} onChange={set('fullName')} onFocus={focus} onBlur={blur} />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Mailing Address *</label>
                <input style={inputStyle} type="text" required placeholder="Street, City, State, ZIP" value={form.mailingAddress} onChange={set('mailingAddress')} onFocus={focus} onBlur={blur} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={labelStyle}>Email Address *</label>
                  <input style={inputStyle} type="email" required value={form.email} onChange={set('email')} onFocus={focus} onBlur={blur} />
                </div>
                <div>
                  <label style={labelStyle}>Phone Number *</label>
                  <input style={inputStyle} type="tel" required placeholder="(206) 000-0000" value={form.phone} onChange={set('phone')} onFocus={focus} onBlur={blur} />
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Course I'd Like to Register For *</label>
                <input style={inputStyle} type="text" required placeholder="e.g. NASM Certified Personal Trainer (CPT)" value={form.course} onChange={set('course')} onFocus={focus} onBlur={blur} />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={labelStyle}>Questions (optional)</label>
                <textarea
                  rows={3}
                  value={form.questions}
                  onChange={set('questions')}
                  onFocus={focus} onBlur={blur}
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
                />
              </div>

              {(step === 'error' || errMsg) && (
                <p style={{ fontSize: '13px', color: '#f87171', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px' }}>
                  {errMsg}
                </p>
              )}

              <button
                type="submit"
                disabled={step === 'loading'}
                style={{
                  width: '100%', padding: '15px',
                  background: step === 'loading' ? 'rgba(37,99,235,0.5)' : '#2563EB',
                  color: '#fff', border: 'none', borderRadius: '50px',
                  fontWeight: 800, fontSize: '12px', letterSpacing: '0.12em',
                  textTransform: 'uppercase', cursor: step === 'loading' ? 'default' : 'pointer',
                }}
              >
                {step === 'loading' ? 'Submitting…' : 'Submit Enrollment'}
              </button>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginTop: '14px' }}>
                Questions? Call us at (206) 322-2322
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
