import { useState } from 'react'

export default function Booking() {
  const [status, setStatus] = useState('idle')
  const [form, setForm] = useState({
    name: '', email: '', phone: '',
    type: 'Tour of the Facility',
    date: '', time: 'Morning (6am – 11am)',
    notes: '',
  })

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    setStatus('loading')
    setTimeout(() => setStatus('success'), 1500)
  }

  const inputStyle = {
    width: '100%',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    padding: '14px 16px',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
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
    <section
      id="booking"
      style={{
        padding: '100px 56px',
        background: 'linear-gradient(135deg,#0d0d0d 0%,#141414 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Glow */}
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '700px', height: '700px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(37,99,235,0.05) 0%,transparent 65%)', pointerEvents: 'none' }} />

      <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '80px', alignItems: 'center', position: 'relative', zIndex: 2 }}>

        {/* Left */}
        <div>
          <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#2563EB', display: 'block', marginBottom: '12px' }}>
            Make an Appointment
          </span>
          <h2
            style={{
              fontFamily: 'Barlow Condensed, sans-serif',
              fontSize: 'clamp(48px,7vw,90px)',
              fontWeight: 900,
              textTransform: 'uppercase',
              lineHeight: 0.95,
              margin: '0 0 24px',
            }}
          >
            <span style={{ color: '#fff' }}>BOOK YOUR</span>
            <br />
            <span style={{ color: '#2563EB', fontStyle: 'italic' }}>VISIT.</span>
          </h2>
          <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.75, marginBottom: '40px' }}>
            Schedule an appointment and we'll make sure you have a personalized experience — whether it's a tour, a membership consult, or your first personal training session. Walk-ins are always welcome too.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { icon: '📍', label: '401 Broadway E, Suite 301, Seattle WA 98102' },
              { icon: '📞', label: '(206) 322-2322' },
              { icon: '🌐', label: 'pnw-fitness.com' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                <div style={{ width: '40px', height: '40px', background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
                  {item.icon}
                </div>
                <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right — appointment form */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(37,99,235,0.15)', borderRadius: '24px', padding: '40px' }}>
          {status === 'success' ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '28px', color: '#fff', fontWeight: 800 }}>
                ✓
              </div>
              <h3 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '32px', fontWeight: 900, textTransform: 'uppercase', color: '#fff', margin: '0 0 12px' }}>
                Appointment Requested!
              </h3>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.7 }}>
                We'll confirm your appointment within 24 hours. Can't wait to see you!
              </p>
              <button onClick={() => setStatus('idle')} style={{ marginTop: '24px', padding: '12px 32px', background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(37,99,235,0.3)', borderRadius: '50px', color: '#2563EB', fontWeight: 700, fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}>
                Book Another
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
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
              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Email</label>
                <input style={inputStyle} type="email" placeholder="your@email.com" value={form.email} onChange={set('email')} required
                  onFocus={e => (e.target.style.borderColor = '#2563EB')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')} />
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Appointment Type</label>
                <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.type} onChange={set('type')}>
                  <option>Tour of the Facility</option>
                  <option>Membership Consultation</option>
                  <option>Personal Training Session</option>
                  <option>Tanning Services</option>
                  <option>Short-Term Pass</option>
                  <option>Other</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
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
                <label style={labelStyle}>Notes (optional)</label>
                <textarea style={{ ...inputStyle, minHeight: '90px', resize: 'vertical' }} placeholder="Any questions or details you'd like to share..." value={form.notes} onChange={set('notes')}
                  onFocus={e => (e.target.style.borderColor = '#2563EB')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')} />
              </div>
              <button
                type="submit"
                disabled={status === 'loading'}
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
                  cursor: status === 'loading' ? 'wait' : 'pointer',
                  opacity: status === 'loading' ? 0.7 : 1,
                }}
              >
                {status === 'loading' ? 'Booking...' : 'Book Appointment'}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
