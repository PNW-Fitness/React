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

const PLANS = [
  { key: 'Basic',   price: '$39/mo'  },
  { key: 'Premier', price: '$59/mo'  },
  { key: 'Elite',   price: '$89/mo'  },
]

function PillCard({ label, sub, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        padding: '10px 12px',
        borderRadius: '10px',
        border: `1px solid ${selected ? '#2563EB' : 'rgba(255,255,255,0.1)'}`,
        background: selected ? 'rgba(37,99,235,0.15)' : 'rgba(255,255,255,0.03)',
        color: selected ? '#2563EB' : 'rgba(255,255,255,0.55)',
        cursor: 'pointer',
        textAlign: 'center',
        transition: 'all 0.15s',
      }}
    >
      <div style={{ fontSize: '13px', fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: '11px', marginTop: '2px', opacity: 0.8 }}>{sub}</div>
    </button>
  )
}

export default function JoinModal({ onClose }) {
  const [step, setStep] = useState('form')
  const [form, setForm] = useState({ name: '', email: '', phone: '', plan: 'Premier' })

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))
  const focus = e => (e.target.style.borderColor = '#2563EB')
  const blur  = e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')

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
          maxWidth: '440px',
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
            <>
              <div style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#2563EB', marginBottom: '8px' }}>
                Membership
              </div>
              <h2 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '36px', fontWeight: 900, textTransform: 'uppercase', color: '#fff', margin: '0 0 28px' }}>
                Join PNW Fitness
              </h2>

              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Full Name</label>
                <input style={inputStyle} type="text" placeholder="Your name" value={form.name} onChange={set('name')} onFocus={focus} onBlur={blur} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Email</label>
                <input style={inputStyle} type="email" placeholder="your@email.com" value={form.email} onChange={set('email')} onFocus={focus} onBlur={blur} />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Phone</label>
                <input style={inputStyle} type="tel" placeholder="(206) 000-0000" value={form.phone} onChange={set('phone')} onFocus={focus} onBlur={blur} />
              </div>

              {/* Plan — pill cards */}
              <div style={{ marginBottom: '28px' }}>
                <label style={labelStyle}>Plan</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {PLANS.map(p => (
                    <PillCard
                      key={p.key}
                      label={p.key}
                      sub={p.price}
                      selected={form.plan === p.key}
                      onClick={() => setForm(f => ({ ...f, plan: p.key }))}
                    />
                  ))}
                </div>
              </div>

              <button
                onClick={() => setStep('done')}
                style={{ width: '100%', padding: '15px', background: '#2563EB', color: '#fff', border: 'none', borderRadius: '50px', fontWeight: 800, fontSize: '12px', letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer' }}
              >
                Submit Application
              </button>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginTop: '14px' }}>
                Or walk in at 401 Broadway E · (206) 322-2322
              </p>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '28px', color: '#fff', fontWeight: 800 }}>✓</div>
              <h3 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '32px', fontWeight: 900, textTransform: 'uppercase', color: '#fff', margin: '0 0 12px' }}>
                Welcome to PNW Fitness!
              </h3>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.7 }}>
                We will reach out within 24 hours to complete your membership. See you on the floor.
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
