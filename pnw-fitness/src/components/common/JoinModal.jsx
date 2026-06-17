import { useState } from 'react'

export default function JoinModal({ onClose }) {
  const [step, setStep] = useState('form')
  const [form, setForm] = useState({ name: '', email: '', phone: '', plan: 'Premier' })

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

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

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.82)',
        backdropFilter: 'blur(8px)',
        zIndex: 9000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        style={{
          background: '#0E2340',
          border: '1px solid rgba(201,168,76,0.25)',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '440px',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Gold top bar */}
        <div style={{ height: '4px', background: '#C9A84C' }} />

        <div style={{ padding: '40px' }}>
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '16px',
              right: '20px',
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.4)',
              fontSize: '24px',
              cursor: 'pointer',
              lineHeight: 1,
            }}
          >
            ×
          </button>

          {step === 'form' ? (
            <>
              <div style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#C9A84C', marginBottom: '8px' }}>
                Membership
              </div>
              <h2
                style={{
                  fontFamily: 'Barlow Condensed, sans-serif',
                  fontSize: '36px',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  color: '#fff',
                  margin: '0 0 28px',
                }}
              >
                Join PNW Fitness
              </h2>

              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Full Name</label>
                <input style={inputStyle} type="text" placeholder="Your name" value={form.name} onChange={set('name')}
                  onFocus={e => (e.target.style.borderColor = '#C9A84C')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Email</label>
                <input style={inputStyle} type="email" placeholder="your@email.com" value={form.email} onChange={set('email')}
                  onFocus={e => (e.target.style.borderColor = '#C9A84C')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Phone</label>
                <input style={inputStyle} type="tel" placeholder="(206) 000-0000" value={form.phone} onChange={set('phone')}
                  onFocus={e => (e.target.style.borderColor = '#C9A84C')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')} />
              </div>
              <div style={{ marginBottom: '28px' }}>
                <label style={labelStyle}>Plan</label>
                <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.plan} onChange={set('plan')}>
                  <option>Basic — $39/mo</option>
                  <option>Premier — $59/mo</option>
                  <option>Elite — $89/mo</option>
                </select>
              </div>

              <button
                onClick={() => setStep('done')}
                style={{
                  width: '100%',
                  padding: '15px',
                  background: '#C9A84C',
                  color: '#0E2340',
                  border: 'none',
                  borderRadius: '50px',
                  fontWeight: 800,
                  fontSize: '12px',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
              >
                Submit Application
              </button>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginTop: '14px' }}>
                Or walk in at 401 Broadway E · (206) 322-2322
              </p>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#C9A84C', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '28px', color: '#0E2340', fontWeight: 800 }}>
                ✓
              </div>
              <h3
                style={{
                  fontFamily: 'Barlow Condensed, sans-serif',
                  fontSize: '32px',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  color: '#fff',
                  margin: '0 0 12px',
                }}
              >
                Welcome to PNW Fitness!
              </h3>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.7 }}>
                We will reach out within 24 hours to complete your membership. See you on the floor.
              </p>
              <button
                onClick={onClose}
                style={{
                  marginTop: '24px',
                  padding: '12px 32px',
                  background: 'rgba(201,168,76,0.15)',
                  border: '1px solid rgba(201,168,76,0.3)',
                  borderRadius: '50px',
                  color: '#C9A84C',
                  fontWeight: 700,
                  fontSize: '12px',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
