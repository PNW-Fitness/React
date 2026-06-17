import { useState, useEffect } from 'react'

const testimonials = [
  {
    text: 'I returned to the gym at age 70 and Keith has been fantastic — working with me to increase strength and improve health. I have put on muscle, lost weight, and significantly lowered my A1C.',
    name: 'Michael Upchurch',
    detail: 'Personal Training Client',
    stars: 5,
  },
  {
    text: 'Over 9 months I have gotten stronger, lost 25 pounds, and have less knee pain. Keith is super creative and makes training fun — even when it is really challenging.',
    name: 'Sarah Bassingthwaighte',
    detail: 'Personal Training Client',
    stars: 5,
  },
  {
    text: 'Bee incorporates Pilates, yoga and barre into our sessions. She focuses on holistic health and has taught me so much about moving energy and caring for my fascia.',
    name: 'Miriam Berger',
    detail: 'Personal Training Client',
    stars: 5,
  },
  {
    text: 'Best gym in Capitol Hill, hands down. The staff actually know your name and care about your progress. The HIIT classes with Coach Avery are absolutely brutal in the best way.',
    name: 'James Thornton',
    detail: 'Premier Member',
    stars: 5,
  },
]

export default function Testimonials() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setActive(a => (a + 1) % testimonials.length), 5000)
    return () => clearInterval(t)
  }, [])

  const t = testimonials[active]

  return (
    <section
      style={{
        padding: '100px 56px',
        background: '#0E2340',
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
          background: 'radial-gradient(circle,rgba(201,168,76,0.06) 0%,transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ maxWidth: '760px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
        <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#C9A84C', display: 'block', marginBottom: '12px' }}>
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
          <span style={{ color: '#C9A84C', fontStyle: 'italic' }}>SPEAK.</span>
        </h2>

        {/* Quote mark */}
        <div
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: '80px',
            lineHeight: 0.6,
            color: '#C9A84C',
            opacity: 0.35,
            marginBottom: '16px',
          }}
        >
          &ldquo;
        </div>

        {/* Quote text */}
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

        {/* Stars */}
        <div style={{ marginBottom: '12px' }}>
          {Array.from({ length: t.stars }).map((_, i) => (
            <span key={i} style={{ color: '#C9A84C', fontSize: '16px' }}>★</span>
          ))}
        </div>

        {/* Author */}
        <div
          style={{
            fontFamily: 'Barlow Condensed, sans-serif',
            fontSize: '18px',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: '#C9A84C',
          }}
        >
          {t.name}
        </div>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginTop: '4px' }}>
          {t.detail}
        </div>

        {/* Dot navigation */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '32px' }}>
          {testimonials.map((_, i) => (
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
                background: i === active ? '#C9A84C' : 'rgba(255,255,255,0.15)',
              }}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
