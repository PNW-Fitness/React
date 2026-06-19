import { useState, useEffect } from 'react'
import StaffCard from '../common/StaffCard'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

export default function Coaches() {
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
    <section id="coaches" style={{ padding: '100px 56px', background: '#141414' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#2563EB', display: 'block', marginBottom: '12px' }}>
            The Team
          </span>
          <h2
            style={{
              fontFamily: 'Barlow Condensed, sans-serif',
              fontSize: 'clamp(48px,7vw,90px)',
              fontWeight: 900,
              textTransform: 'uppercase',
              lineHeight: 0.95,
              margin: '0 0 16px',
            }}
          >
            <span style={{ color: '#fff' }}>MEET THE </span>
            <span style={{ color: '#2563EB', fontStyle: 'italic' }}>COACHES.</span>
          </h2>
          <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.45)', maxWidth: '500px', margin: '0 auto' }}>
            Every coach at PNW Fitness holds NASM credentials and builds programs around you.
          </p>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>
            Loading coaches…
          </div>
        )}

        {!loading && error && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(239,68,68,0.7)', fontSize: '13px' }}>
            Could not load coaches — is the API server running?
          </div>
        )}

        {!loading && !error && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '12px' }}>
            {coaches.map(c => (
              <StaffCard key={c.id} staff={c} variant="teaser" />
            ))}
          </div>
        )}

      </div>
    </section>
  )
}
