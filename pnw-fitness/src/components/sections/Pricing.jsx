import { useState } from 'react'

const MONTHLY = 99.99
const YEARLY  = 899
const YEARLY_MONTHLY_EQUIV = (YEARLY / 12).toFixed(2)   // 74.92
const SAVINGS = ((MONTHLY * 12) - YEARLY).toFixed(2)     // 300.88
const SAVINGS_PCT = Math.round((1 - YEARLY / (MONTHLY * 12)) * 100) // 25

const features = [
  'Full gym floor access',
  'Locker rooms & showers',
  'All group fitness classes',
  '1 guest pass per month',
  'Access to stretching zone',
  'NASM-certified coaching staff',
]

export default function Pricing({ onJoinClick }) {
  const [yearly, setYearly] = useState(false)

  return (
    <section
      id="pricing"
      style={{
        padding: '100px 56px',
        background: '#080C10',
      }}
    >
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#C9A84C', display: 'block', marginBottom: '12px' }}>
            Membership
          </span>
          <h2
            style={{
              fontFamily: 'Barlow Condensed, sans-serif',
              fontSize: 'clamp(48px,7vw,90px)',
              fontWeight: 900,
              textTransform: 'uppercase',
              lineHeight: 0.95,
              margin: '0 0 32px',
            }}
          >
            <span style={{ color: '#fff' }}>SIMPLE </span>
            <span style={{ color: '#C9A84C', fontStyle: 'italic' }}>PRICING.</span>
          </h2>

          {/* Toggle */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '50px', padding: '8px 20px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: !yearly ? '#C9A84C' : 'rgba(255,255,255,0.4)', transition: 'color 0.2s' }}>
              Monthly
            </span>
            <button
              onClick={() => setYearly(!yearly)}
              aria-label="Toggle billing period"
              style={{
                width: '52px',
                height: '28px',
                borderRadius: '50px',
                border: 'none',
                background: '#C9A84C',
                cursor: 'pointer',
                position: 'relative',
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '3px',
                  left: yearly ? '27px' : '3px',
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  background: '#0E2340',
                  transition: 'left 0.2s',
                }}
              />
            </button>
            <span style={{ fontSize: '13px', fontWeight: 700, color: yearly ? '#C9A84C' : 'rgba(255,255,255,0.4)', transition: 'color 0.2s', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Yearly
              <span style={{ fontSize: '10px', background: 'rgba(201,168,76,0.15)', color: '#C9A84C', padding: '2px 8px', borderRadius: '50px', border: '1px solid rgba(201,168,76,0.3)' }}>
                Save {SAVINGS_PCT}%
              </span>
            </span>
          </div>
        </div>

        {/* Single plan card */}
        <div style={{ maxWidth: '560px', margin: '0 auto' }}>
          <div
            style={{
              background: '#0E2340',
              border: '1px solid #C9A84C',
              borderRadius: '32px',
              padding: '48px 40px',
              position: 'relative',
              boxShadow: '0 40px 80px rgba(201,168,76,0.12)',
            }}
          >
            {/* Most Popular badge */}
            <div
              style={{
                position: 'absolute',
                top: '-14px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#C9A84C',
                color: '#0E2340',
                fontSize: '9px',
                fontWeight: 800,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                padding: '5px 18px',
                borderRadius: '50px',
                whiteSpace: 'nowrap',
              }}
            >
              Most Popular
            </div>

            {/* Plan name */}
            <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#C9A84C', marginBottom: '24px', textAlign: 'center' }}>
              {yearly ? 'Paid in Full — Annual' : 'Month to Month'}
            </div>

            {/* Price display */}
            <div style={{ textAlign: 'center', marginBottom: '8px' }}>
              {yearly && (
                <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.35)', textDecoration: 'line-through', marginBottom: '4px' }}>
                  ${MONTHLY}/mo
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', justifyContent: 'center' }}>
                <span
                  style={{
                    fontFamily: 'Barlow Condensed, sans-serif',
                    fontSize: '72px',
                    fontWeight: 900,
                    color: '#fff',
                    lineHeight: 1,
                  }}
                >
                  {yearly ? `$${YEARLY_MONTHLY_EQUIV}` : `$${MONTHLY}`}
                </span>
                <span style={{ fontSize: '16px', color: 'rgba(255,255,255,0.4)' }}>/mo</span>
              </div>

              {yearly ? (
                <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)' }}>
                    Billed as <strong style={{ color: '#fff' }}>${YEARLY}</strong> once per year
                  </span>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    background: 'rgba(74,222,128,0.12)',
                    color: '#4ade80',
                    border: '1px solid rgba(74,222,128,0.25)',
                    padding: '3px 10px',
                    borderRadius: '50px',
                  }}>
                    You save ${SAVINGS}
                  </span>
                </div>
              ) : (
                <div style={{ marginTop: '8px', fontSize: '13px', color: 'rgba(255,255,255,0.35)' }}>
                  Billed monthly — cancel anytime
                </div>
              )}
            </div>

            <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.08)', margin: '32px 0' }} />

            {/* Features */}
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 36px' }}>
              {features.map(f => (
                <li
                  key={f}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 0',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    fontSize: '14px',
                    color: 'rgba(255,255,255,0.75)',
                  }}
                >
                  <span style={{ color: '#C9A84C', fontWeight: 800, fontSize: '15px', flexShrink: 0 }}>✓</span>
                  {f}
                </li>
              ))}
            </ul>

            <button
              onClick={onJoinClick}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '50px',
                border: 'none',
                background: '#C9A84C',
                color: '#0E2340',
                fontWeight: 800,
                fontSize: '12px',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              {yearly ? `Join Now — $${YEARLY}/yr` : 'Join Now — $99.99/mo'}
            </button>
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginTop: '32px' }}>
          No long-term contracts on monthly. Cancel anytime.
        </p>
      </div>
    </section>
  )
}
