import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'

export default function FAQ() {
  const [faqs, setFaqs] = useState([])
  const [open, setOpen] = useState(0)

  useEffect(() => {
    supabase
      .from('faqs')
      .select('*')
      .eq('active', true)
      .order('display_order')
      .then(({ data }) => setFaqs(data ?? []))
  }, [])

  return (
    <section
      style={{
        padding: '100px 56px',
        background: '#111111',
      }}
    >
      <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '80px', alignItems: 'start' }}>

        {/* Left */}
        <div>
          <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#2563EB', display: 'block', marginBottom: '12px' }}>
            FAQ
          </span>
          <h2
            style={{
              fontFamily: 'Barlow Condensed, sans-serif',
              fontSize: 'clamp(42px,6vw,80px)',
              fontWeight: 900,
              textTransform: 'uppercase',
              lineHeight: 0.95,
              margin: '0 0 24px',
            }}
          >
            <span style={{ color: '#fff' }}>COMMON<br />QUESTIONS</span>
          </h2>
          <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.75, marginBottom: '32px' }}>
            Still have questions? Call us at (206) 322-2322 or stop by during staffed hours — we are always happy to help.
          </p>
          <a
            href="#booking"
            style={{
              display: 'inline-block',
              background: '#2563EB',
              color: '#fff',
              padding: '14px 32px',
              borderRadius: '50px',
              fontWeight: 800,
              fontSize: '11px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              textDecoration: 'none',
            }}
          >
            Contact Us
          </a>
        </div>

        {/* Right — accordion */}
        <div>
          {faqs.map((faq, i) => (
            <div
              key={faq.id}
              style={{
                borderBottom: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <button
                onClick={() => setOpen(open === i ? -1 : i)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '20px 0',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  gap: '16px',
                }}
              >
                <span
                  style={{
                    fontFamily: 'Barlow Condensed, sans-serif',
                    fontSize: '18px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.02em',
                    color: open === i ? '#2563EB' : '#fff',
                    transition: 'color 0.2s',
                  }}
                >
                  {faq.question}
                </span>
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    border: 'none',
                    background: open === i ? '#2563EB' : 'rgba(255,255,255,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    color: open === i ? '#141414' : 'rgba(255,255,255,0.5)',
                    fontSize: '18px',
                    fontWeight: 700,
                    transition: 'all 0.2s',
                  }}
                >
                  {open === i ? '−' : '+'}
                </div>
              </button>
              {open === i && (
                <div style={{ paddingBottom: '20px' }}>
                  <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.75, margin: 0 }}>
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}

          <div style={{ marginTop: '28px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>
              More questions? View our full policies and FAQ page.
            </span>
            <a
              href="/faq"
              style={{ fontSize: '11px', fontWeight: 800, color: '#2563EB', letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none', whiteSpace: 'nowrap' }}
            >
              View All →
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
