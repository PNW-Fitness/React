import { useState, useEffect } from 'react'
import { ChevronRight } from 'lucide-react'
import StaffCard from '../components/common/StaffCard'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

export default function CoachesPage({ onJoinClick }) {
  const [coaches, setCoaches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    fetch(`${API_URL}/api/staff?role=personal_trainer`)
      .then(r => { if (!r.ok) throw new Error(r.statusText); return r.json() })
      .then(data => { setCoaches(data); setLoading(false) })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', paddingTop: '100px' }}>

      {/* Page header */}
      <div style={{ padding: '60px 56px 72px', maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '40px', flexWrap: 'wrap' }}>
        <div>
          <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#2563EB', display: 'block', marginBottom: '12px' }}>
            The Team
          </span>
          <h1 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 'clamp(56px,9vw,110px)', fontWeight: 900, textTransform: 'uppercase', lineHeight: 0.9, margin: '0 0 20px', color: '#fff' }}>
            MEET THE<br />
            <span style={{ color: '#2563EB', fontStyle: 'italic' }}>COACHES.</span>
          </h1>
          <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.75, maxWidth: '520px', margin: 0 }}>
            Every coach at PNW Fitness holds NASM credentials and builds programs around you — not a template.
            Get to know the team, then book your first session.
          </p>
        </div>
        <button onClick={onJoinClick} style={{ background: '#2563EB', color: '#fff', border: 'none', padding: '16px 36px', borderRadius: '50px', fontWeight: 800, fontSize: '13px', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap', flexShrink: 0 }}>
          Book a Session <ChevronRight size={14} />
        </button>
      </div>

      {/* Coach cards */}
      <div style={{ padding: '0 56px 100px', maxWidth: '1200px', margin: '0 auto' }}>

        {loading && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>
            Loading coaches…
          </div>
        )}

        {!loading && error && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'rgba(239,68,68,0.7)', fontSize: '13px' }}>
            Could not load coaches — is the API server running?
          </div>
        )}

        {!loading && !error && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {coaches.map(c => (
              <StaffCard key={c.id} staff={c} variant="full" />
            ))}
          </div>
        )}

        {/* CTA banner */}
        <div style={{ marginTop: '64px', background: 'linear-gradient(135deg,#0d0d0d,#141414)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: '20px', padding: '56px 48px', textAlign: 'center' }}>
          <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#2563EB', display: 'block', marginBottom: '12px' }}>
            Ready to Start?
          </span>
          <h3 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 'clamp(36px,5vw,64px)', fontWeight: 900, textTransform: 'uppercase', color: '#fff', margin: '0 0 16px' }}>
            Train with the best.
          </h3>
          <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.45)', margin: '0 auto 32px', maxWidth: '480px' }}>
            Book your first session or join today and get unlimited access to all group classes.
          </p>
          <button onClick={onJoinClick} style={{ background: '#2563EB', color: '#fff', border: 'none', padding: '16px 40px', borderRadius: '50px', fontWeight: 800, fontSize: '13px', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            Join Now <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
