import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import StaffCard from '../common/StaffCard'

export default function Coaches({ onTaClick }) {
  const [coaches, setCoaches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('staff_roles')
        .select('display_order, classes_taught, staff!inner(id, name, photo_url, initial, cert, specialty, bio, tags, active)')
        .eq('role', 'personal_trainer')
        .order('display_order')

      if (error) { console.error('Coaches fetch error:', error); setError(error.message); setLoading(false); return }
      setCoaches((data ?? []).map(r => ({ ...r.staff, classes_taught: r.classes_taught })))
      setLoading(false)
    }
    load()
  }, [])

  return (
    <section id="trainers" style={{ padding: '100px 56px', background: '#141414' }}>
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
            <span style={{ color: '#2563EB', fontStyle: 'italic' }}>TRAINERS.</span>
          </h2>
          <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.45)', maxWidth: '500px', margin: '0 auto' }}>
            Every trainer at PNW Fitness holds NASM credentials and builds programs around you.
          </p>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>
            Loading trainers…
          </div>
        )}

        {!loading && error && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(239,68,68,0.6)', fontSize: '13px' }}>
            Could not load trainers: {error}
          </div>
        )}

        {!loading && !error && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '12px' }}>
            {coaches.map(c => (
              <StaffCard key={c.id} staff={c} variant="teaser" />
            ))}
          </div>
        )}

      {/* TA CTA */}
      <div style={{ marginTop: '64px', background: 'linear-gradient(135deg,#0d0d0d,#141414)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: '20px', padding: '48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '32px', flexWrap: 'wrap' }}>
        <div>
          <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#2563EB', display: 'block', marginBottom: '8px' }}>Free · No Commitment</span>
          <h3 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 'clamp(28px,4vw,48px)', fontWeight: 900, textTransform: 'uppercase', color: '#fff', margin: '0 0 10px' }}>
            Not Sure Where to Start?
          </h3>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.45)', margin: 0, maxWidth: '420px', lineHeight: 1.7 }}>
            Book a free training assessment. One of our NASM-certified trainers will talk through your goals and build a plan around you.
          </p>
        </div>
        <button
          onClick={onTaClick}
          style={{ background: '#2563EB', color: '#fff', border: 'none', padding: '16px 36px', borderRadius: '50px', fontWeight: 800, fontSize: '13px', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
        >
          Book Free Assessment →
        </button>
      </div>

      </div>
    </section>
  )
}
