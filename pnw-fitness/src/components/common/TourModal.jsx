import { useState } from 'react'

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

const TIME_OPTIONS  = ['Morning (6am – 11am)', 'Midday (11am – 2pm)', 'Afternoon (2pm – 5pm)', 'Evening (5pm – 9pm)']
const GROUP_OPTIONS = ['Just me', '2 – 3 people', '4 or more']

function PillGroup({ options, value, onChange, wrap }) {
  return (
    <div style={{ display: 'flex', flexWrap: wrap ? 'wrap' : 'nowrap', gap: '8px' }}>
      {options.map(opt => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          style={{
            padding: '9px 14px',
            borderRadius: '50px',
            border: `1px solid ${value === opt ? '#2563EB' : 'rgba(255,255,255,0.1)'}`,
            background: value === opt ? 'rgba(37,99,235,0.15)' : 'rgba(255,255,255,0.03)',
            color: value === opt ? '#2563EB' : 'rgba(255,255,255,0.5)',
            fontSize: '12px',
            fontWeight: value === opt ? 700 : 400,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'all 0.15s',
          }}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

export default function TourModal({ onClose }) {
  const [step, setStep] = useState('form')
  const [form, setForm] = useState({
    name: '', email: '', phone: '',
    date: '', time: 'Morning (6am – 11am)', group: 'Just me', notes: '',
  })

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))
  const focus = e => (e.target.style.borderColor = '#2563EB')
  const blur  = e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')
  const handleSubmit = (e) => { e.preventDefault(); setStep('done') }

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
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div style={{ height: '4px', background: '#2563EB' }} />

        <div style={{ padding: '40px' }}>
          <button
            onClick={onClose}
            style={{ position: 'absolute', top: '16px', right: '20px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '24px', cursor: 'pointer', lineHeight: 1 }}
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
                  <input style={inputStyle} type="text" placeholder="Your name" value={form.name} onChange={set('name')} required onFocus={focus} onBlur={blur} />
                </div>
                <div>
                  <label style={labelStyle}>Phone</label>
                  <input style={inputStyle} type="tel" placeholder="(206) 000-0000" value={form.phone} onChange={set('phone')} onFocus={focus} onBlur={blur} />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Email</label>
                <input style={inputStyle} type="email" placeholder="your@email.com" value={form.email} onChange={set('email')} required onFocus={focus} onBlur={blur} />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Preferred Date</label>
                <input style={{ ...inputStyle, colorScheme: 'dark' }} type="date" value={form.date} onChange={set('date')} onFocus={focus} onBlur={blur} />
              </div>

              {/* Time — pills */}
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Preferred Time</label>
                <PillGroup options={TIME_OPTIONS} value={form.time} onChange={v => setForm(f => ({ ...f, time: v }))} wrap />
              </div>

              {/* Group — pills */}
              <div style={{ marginBottom: '28px' }}>
                <label style={labelStyle}>Group Size</label>
                <PillGroup options={GROUP_OPTIONS} value={form.group} onChange={v => setForm(f => ({ ...f, group: v }))} />
              </div>

              <button
                type="submit"
                style={{ width: '100%', padding: '15px', background: '#2563EB', color: '#fff', border: 'none', borderRadius: '50px', fontWeight: 800, fontSize: '12px', letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer' }}
              >
                Request Tour
              </button>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginTop: '14px' }}>
                Or just walk in at 401 Broadway E · (206) 322-2322
              </p>
            </form>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '28px', color: '#fff', fontWeight: 800 }}>✓</div>
              <h3 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '32px', fontWeight: 900, textTransform: 'uppercase', color: '#fff', margin: '0 0 12px' }}>
                Tour Requested!
              </h3>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.7 }}>
                We'll reach out within 24 hours to confirm your tour. Can't wait to show you around!
              </p>
              <button onClick={onClose} style={{ marginTop: '24px', padding: '12px 32px', background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(37,99,235,0.3)', borderRadius: '50px', color: '#2563EB', fontWeight: 700, fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}>
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
