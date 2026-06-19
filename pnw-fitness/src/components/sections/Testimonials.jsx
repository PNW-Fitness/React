import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'

export default function Testimonials() {
  const [items, setItems] = useState([])
  const [active, setActive] = useState(0)

  useEffect(() => {
    supabase
      .from('testimonials')
      .select('*')
      .eq('active', true)
      .order('display_order')
      .then(({ data }) => setItems(data ?? []))
  }, [])

  useEffect(() => {
    if (items.length === 0) return
    const t = setInterval(() => setActive(a => (a + 1) % items.length), 5000)
    return () => clearInterval(t)
  }, [items.length])

  const t = items[active]

  return (
    <section
      style={{
        padding: '100px 56px',
        background: '#141414',
        position: 'relative',
        overflow: 'hidden',
        textAlign: 'center',
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%,-50%)',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle,rgba(37,99,235,0.06) 0%,transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ maxWidth: '760px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
        <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#2563EB', display: 'block', marginBottom: '12px' }}>
          Member Stories
        </span>
        <h2
          style={{
            fontFamily: 'Barlow Condensed, sans-serif',
            fontSize: 'clamp(42px,6vw,80px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            lineHeight: 0.95,
            margin: '0 0 48px',
          }}
        >
          <span style={{ color: '#fff' }}>RESULTS THAT </span>
          <span style={{ color: '#2563EB', fontStyle: 'italic' }}>SPEAK.</span>
        </h2>

        {t && (
          <>
            <div
              style={{
                fontFamily: 'Georgia, serif',
                fontSize: '80px',
                lineHeight: 0.6,
                color: '#2563EB',
                opacity: 0.35,
                marginBottom: '16px',
              }}
            >
              &ldquo;
            </div>

            <p
              style={{
                fontSize: '18px',
                color: 'rgba(255,255,255,0.82)',
                lineHeight: 1.78,
                fontStyle: 'italic',
                marginBottom: '28px',
                minHeight: '100px',
                transition: 'opacity 0.4s',
              }}
            >
              {t.text}
            </p>

            <div style={{ marginBottom: '12px' }}>
              {Array.from({ length: t.stars }).map((_, i) => (
                <span key={i} style={{ color: '#2563EB', fontSize: '16px' }}>★</span>
              ))}
            </div>

            <div
              style={{
                fontFamily: 'Barlow Condensed, sans-serif',
                fontSize: '18px',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#2563EB',
              }}
            >
              {t.name}
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginTop: '4px' }}>
              {t.detail}
            </div>
          </>
        )}

        {/* Dot navigation */}
        {items.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '32px' }}>
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                style={{
                  height: '3px',
                  border: 'none',
                  cursor: 'pointer',
                  borderRadius: '2px',
                  transition: 'all 0.3s',
                  width: i === active ? '36px' : '12px',
                  background: i === active ? '#2563EB' : 'rgba(255,255,255,0.15)',
                }}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
