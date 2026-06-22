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

const CONTACT_OPTIONS   = ['Call', 'Text', 'Email']
const MEMBER_OPTIONS    = [
  'No, but considering joining',
  'Former member considering returning',
  'Yes, current member',
]
const FITNESS_OPTIONS   = [
  'Just getting started',
  'Some experience',
  'Moderately active (2–3×/week)',
  'Very active (4+×/week)',
  'Athlete or advanced',
]

function RadioGroup({ name, options, value, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {options.map(opt => (
        <label
          key={opt}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
            fontSize: '14px',
            color: value === opt ? '#fff' : 'rgba(255,255,255,0.55)',
          }}
        >
          <span
            style={{
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              border: `2px solid ${value === opt ? '#2563EB' : 'rgba(255,255,255,0.2)'}`,
              background: value === opt ? '#2563EB' : 'transparent',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {value === opt && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fff' }} />}
          </span>
          <input
            type="radio"
            name={name}
            value={opt}
            checked={value === opt}
            onChange={() => onChange(opt)}
            style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
          />
          {opt}
        </label>
      ))}
    </div>
  )
}

const EMPTY = {
  email: '', firstName: '', lastName: '', phone: '',
  contactMethod: '', membershipStatus: '', goals: '',
  fitnessLevel: '', availability: '', medicalNotes: '',
}

export default function TrainingAssessmentModal({ onClose }) {
  const [form, setForm]     = useState(EMPTY)
  const [step, setStep]     = useState('form')  // 'form' | 'loading' | 'done' | 'error'
  const [errMsg, setErrMsg] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const onChange = k => e => set(k, e.target.value)
  const focus = e => (e.target.style.borderColor = '#2563EB')
  const blur  = e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')

  async function handleSubmit(e) {
    e.preventDefault()

    if (!form.contactMethod) { setErrMsg('Please select a preferred contact method.'); return }
    if (!form.membershipStatus) { setErrMsg('Please select your membership status.'); return }

    if (form.phone) {
      const digits = form.phone.replace(/\D/g, '')
      if (digits.length !== 10) { setErrMsg('Phone number must be 10 digits.'); return }
    }

    setErrMsg('')
    setStep('loading')

    const { data, error } = await supabase.from('lead_submissions').insert({
      source: 'training_assessment',
      name:   `${form.firstName.trim()} ${form.lastName.trim()}`,
      email:  form.email.trim(),
      phone:  form.phone.trim() || null,
      details: {
        contact_method:    form.contactMethod,
        membership_status: form.membershipStatus,
        goals:             form.goals.trim(),
        fitness_level:     form.fitnessLevel || null,
        availability:      form.availability.trim() || null,
        medical_notes:     form.medicalNotes.trim() || null,
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
          maxWidth: '520px',
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
                Request Received!
              </h3>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.7 }}>
                One of our NASM-certified trainers will follow up within 24 hours to schedule your free assessment.
              </p>
              <button onClick={onClose} style={{ marginTop: '24px', padding: '12px 32px', background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(37,99,235,0.3)', borderRadius: '50px', color: '#2563EB', fontWeight: 700, fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}>
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#2563EB', marginBottom: '8px' }}>
                Free Training Assessment
              </div>
              <h2 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '34px', fontWeight: 900, textTransform: 'uppercase', color: '#fff', margin: '0 0 6px' }}>
                Start Your Assessment
              </h2>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '28px', lineHeight: 1.6 }}>
                Tell us about your goals and a trainer will follow up within 24 hours.
              </p>

              {/* Name row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={labelStyle}>First Name *</label>
                  <input style={inputStyle} type="text" required value={form.firstName} onChange={onChange('firstName')} onFocus={focus} onBlur={blur} />
                </div>
                <div>
                  <label style={labelStyle}>Last Name *</label>
                  <input style={inputStyle} type="text" required value={form.lastName} onChange={onChange('lastName')} onFocus={focus} onBlur={blur} />
                </div>
              </div>

              {/* Email + Phone */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={labelStyle}>Email *</label>
                  <input style={inputStyle} type="email" required value={form.email} onChange={onChange('email')} onFocus={focus} onBlur={blur} />
                </div>
                <div>
                  <label style={labelStyle}>Phone (optional)</label>
                  <input style={inputStyle} type="tel" placeholder="(206) 000-0000" value={form.phone} onChange={onChange('phone')} onFocus={focus} onBlur={blur} />
                </div>
              </div>

              {/* Contact method */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ ...labelStyle, marginBottom: '10px' }}>Preferred Contact *</label>
                <RadioGroup name="contactMethod" options={CONTACT_OPTIONS} value={form.contactMethod} onChange={v => set('contactMethod', v)} />
              </div>

              {/* Membership status */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ ...labelStyle, marginBottom: '10px' }}>Are you a current member? *</label>
                <RadioGroup name="membershipStatus" options={MEMBER_OPTIONS} value={form.membershipStatus} onChange={v => set('membershipStatus', v)} />
              </div>

              {/* Goals */}
              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>What would you like to achieve? *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Examples: lose weight, build muscle, train for an event, improve mobility, etc."
                  value={form.goals}
                  onChange={onChange('goals')}
                  onFocus={focus} onBlur={blur}
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
                />
              </div>

              {/* Fitness level — pills */}
              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Current Fitness Level (optional)</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {FITNESS_OPTIONS.map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => set('fitnessLevel', form.fitnessLevel === opt ? '' : opt)}
                      style={{
                        padding: '9px 14px',
                        borderRadius: '8px',
                        border: `1px solid ${form.fitnessLevel === opt ? '#2563EB' : 'rgba(255,255,255,0.1)'}`,
                        background: form.fitnessLevel === opt ? 'rgba(37,99,235,0.15)' : 'rgba(255,255,255,0.03)',
                        color: form.fitnessLevel === opt ? '#2563EB' : 'rgba(255,255,255,0.5)',
                        fontSize: '13px',
                        fontWeight: form.fitnessLevel === opt ? 700 : 400,
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s',
                      }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Availability */}
              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Availability / Scheduling Preferences (optional)</label>
                <textarea
                  rows={2}
                  placeholder="Gym hours: Weekdays 6am–9pm | Weekends 8am–8pm"
                  value={form.availability}
                  onChange={onChange('availability')}
                  onFocus={focus} onBlur={blur}
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
                />
              </div>

              {/* Medical notes */}
              <div style={{ marginBottom: '24px' }}>
                <label style={labelStyle}>Medical / Joint Considerations (optional)</label>
                <textarea
                  rows={2}
                  value={form.medicalNotes}
                  onChange={onChange('medicalNotes')}
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
                {step === 'loading' ? 'Submitting…' : 'Request Free Assessment'}
              </button>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginTop: '14px' }}>
                Or stop by at 401 Broadway E · (206) 322-2322
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
