import { useState } from 'react'

export default function TourModal({ onClose }) {
  const [step, setStep] = useState('form')
  const [form, setForm] = useState({
    name: '', email: '', phone: '',
    date: '', time: 'Morning (6am – 11am)', group: 'Just me', notes: '',
  })

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

  const handleSubmit = (e) => {
    e.preventDefault()
    setStep('done')
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
          background: '#141414',
          border: '1px solid rgba(37,99,235,0.25)',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '480px',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div style={{ height: '4px', background: '#2563EB' }} />

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
            <form onSubmit={handleSubmit}>
              <div style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#2563EB', marginBottom: '8px' }}>
                Schedule a Tour
              </div>
              <h2 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '34px', fontWeight: 900, textTransform: 'uppercase', color: '#fff', margin: '0 0 8px' }}>
                See the Facility
              </h2>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', marginBottom: '24px', lineHeight: 1.6 }}>
                Come see our 22,000 sq ft facility in person. We'll walk you through everything and answer all your questions.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={labelStyle}>Full Name</label>
                  <input style={inputStyle} type="text" placeholder="Your name" value={form.name} onChange={set('name')} required
                    onFocus={e => (e.target.style.borderColor = '#2563EB')}
                    onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')} />
                </div>
                <div>
                  <label style={labelStyle}>Phone</label>
                  <input style={inputStyle} type="tel" placeholder="(206) 000-0000" value={form.phone} onChange={set('phone')}
                    onFocus={e => (e.target.style.borderColor = '#2563EB')}
                    onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')} />
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={labelStyle}>Email</label>
                <input style={inputStyle} type="email" placeholder="your@email.com" value={form.email} onChange={set('email')} required
                  onFocus={e => (e.target.style.borderColor = '#2563EB')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={labelStyle}>Preferred Date</label>
                  <input style={{ ...inputStyle, colorScheme: 'dark' }} type="date" value={form.date} onChange={set('date')}
                    onFocus={e => (e.target.style.borderColor = '#2563EB')}
                    onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')} />
                </div>
                <div>
                  <label style={labelStyle}>Preferred Time</label>
                  <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.time} onChange={set('time')}>
                    <option>Morning (6am – 11am)</option>
                    <option>Midday (11am – 2pm)</option>
                    <option>Afternoon (2pm – 5pm)</option>
                    <option>Evening (5pm – 9pm)</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={labelStyle}>Group Size</label>
                <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.group} onChange={set('group')}>
                  <option>Just me</option>
                  <option>2 – 3 people</option>
                  <option>4 or more</option>
                </select>
              </div>

              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '15px',
                  background: '#2563EB',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '50px',
                  fontWeight: 800,
                  fontSize: '12px',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
              >
                Request Tour
              </button>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginTop: '14px' }}>
                Or just walk in at 401 Broadway E · (206) 322-2322
              </p>
            </form>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '28px', color: '#fff', fontWeight: 800 }}>
                ✓
              </div>
              <h3 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '32px', fontWeight: 900, textTransform: 'uppercase', color: '#fff', margin: '0 0 12px' }}>
                Tour Requested!
              </h3>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.7 }}>
                We'll reach out within 24 hours to confirm your tour. Can't wait to show you around!
              </p>
              <button
                onClick={onClose}
                style={{ marginTop: '24px', padding: '12px 32px', background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(37,99,235,0.3)', borderRadius: '50px', color: '#2563EB', fontWeight: 700, fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}
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
