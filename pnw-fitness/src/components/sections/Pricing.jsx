import { useState } from 'react'

const MONTHLY     = 99.99
const YEARLY      = 899
const YEARLY_EQUIV = (YEARLY / 12).toFixed(2)
const SAVINGS      = ((MONTHLY * 12) - YEARLY).toFixed(2)
const SAVINGS_PCT  = Math.round((1 - YEARLY / (MONTHLY * 12)) * 100)

const resultsFeatures = [
  'Unlimited access to the facility',
  'Unlimited group fitness classes',
  '(3) 60-minute personal training sessions ($180 value)',
  'Ability to freeze membership',
  'Month-to-month agreement',
  'No long-term contract',
  'No hidden fees',
]

const monthlyFeatures = [
  'Unlimited access to the facility',
  'Unlimited group fitness classes',
  'Ability to freeze membership',
  'Month-to-month or annual agreement',
  'No long-term contract',
  'No hidden fees',
]

export default function Pricing({ onJoinClick }) {
  const [yearly, setYearly] = useState(false)

  return (
    <section
      id="pricing"
      style={{
        padding: '100px 56px',
        background: '#0a0a0a',
      }}
    >
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#2563EB', display: 'block', marginBottom: '12px' }}>
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
            <span style={{ color: '#2563EB', fontStyle: 'italic' }}>PRICING.</span>
          </h2>

          {/* Toggle — affects Month to Month card only */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '50px', padding: '8px 20px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: !yearly ? '#2563EB' : 'rgba(255,255,255,0.4)', transition: 'color 0.2s' }}>
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
                background: '#2563EB',
                cursor: 'pointer',
                position: 'relative',
                flexShrink: 0,
              }}
            >
              <div style={{
                position: 'absolute',
                top: '3px',
                left: yearly ? '27px' : '3px',
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                background: '#141414',
                transition: 'left 0.2s',
              }} />
            </button>
            <span style={{ fontSize: '13px', fontWeight: 700, color: yearly ? '#2563EB' : 'rgba(255,255,255,0.4)', transition: 'color 0.2s', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Yearly
              <span style={{ fontSize: '10px', background: 'rgba(37,99,235,0.15)', color: '#2563EB', padding: '2px 8px', borderRadius: '50px', border: '1px solid rgba(37,99,235,0.3)' }}>
                Save {SAVINGS_PCT}%
              </span>
            </span>
          </div>
        </div>

        {/* Two plan cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }}>

          {/* Results plan */}
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '32px',
            padding: '40px 32px',
          }}>
            <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#2563EB', marginBottom: '8px' }}>
              Results
            </div>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '18px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '24px' }}>
              Month to Month
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '6px' }}>
              <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '60px', fontWeight: 900, color: '#fff', lineHeight: 1 }}>
                $89.99
              </span>
              <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>/mo</span>
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginBottom: '32px' }}>
              Billed monthly — cancel anytime
            </div>

            <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.08)', marginBottom: '28px' }} />

            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px' }}>
              {resultsFeatures.map(f => (
                <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
                  <span style={{ color: '#2563EB', fontWeight: 800, fontSize: '14px', flexShrink: 0, marginTop: '1px' }}>✓</span>
                  {f}
                </li>
              ))}
            </ul>

            <button
              onClick={onJoinClick}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '50px',
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'transparent',
                color: '#fff',
                fontWeight: 800,
                fontSize: '11px',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#2563EB'
                e.currentTarget.style.color = '#141414'
                e.currentTarget.style.borderColor = '#2563EB'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = '#fff'
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'
              }}
            >
              Join Results — $89.99/mo
            </button>
          </div>

          {/* Month to Month / Annual */}
          <div style={{
            background: '#141414',
            border: '1px solid #2563EB',
            borderRadius: '32px',
            padding: '40px 32px',
            position: 'relative',
            boxShadow: '0 40px 80px rgba(37,99,235,0.12)',
          }}>
            {/* Most Popular badge */}
            <div style={{
              position: 'absolute',
              top: '-14px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#2563EB',
              color: '#fff',
              fontSize: '9px',
              fontWeight: 800,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              padding: '5px 18px',
              borderRadius: '50px',
              whiteSpace: 'nowrap',
            }}>
              Most Popular
            </div>

            <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#2563EB', marginBottom: '8px' }}>
              {yearly ? 'Paid in Full' : 'Month to Month'}
            </div>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '18px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '24px' }}>
              {yearly ? 'Annual' : 'Membership'}
            </div>

            {/* Price */}
            {yearly && (
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', textDecoration: 'line-through', marginBottom: '4px' }}>
                ${MONTHLY}/mo
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '6px' }}>
              <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '60px', fontWeight: 900, color: '#fff', lineHeight: 1 }}>
                {yearly ? `$${YEARLY_EQUIV}` : `$${MONTHLY}`}
              </span>
              <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>/mo</span>
            </div>

            {yearly ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '32px' }}>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                  Billed as <strong style={{ color: '#fff' }}>${YEARLY}</strong>/yr
                </span>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  background: 'rgba(74,222,128,0.12)',
                  color: '#4ade80',
                  border: '1px solid rgba(74,222,128,0.25)',
                  padding: '3px 10px',
                  borderRadius: '50px',
                  whiteSpace: 'nowrap',
                }}>
                  You save ${SAVINGS}
                </span>
              </div>
            ) : (
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginBottom: '32px' }}>
                Billed monthly — cancel anytime
              </div>
            )}

            <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.08)', marginBottom: '28px' }} />

            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px' }}>
              {monthlyFeatures.map(f => (
                <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '13px', color: 'rgba(255,255,255,0.75)' }}>
                  <span style={{ color: '#2563EB', fontWeight: 800, fontSize: '14px', flexShrink: 0, marginTop: '1px' }}>✓</span>
                  {f}
                </li>
              ))}
            </ul>

            <button
              onClick={onJoinClick}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '50px',
                border: 'none',
                background: '#2563EB',
                color: '#fff',
                fontWeight: 800,
                fontSize: '11px',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              {yearly ? `Join Now — $${YEARLY}/yr` : 'Join Now — $99.99/mo'}
            </button>
          </div>
        </div>

        {/* In-person incentive callout */}
        <div style={{ marginTop: '24px', padding: '20px 28px', background: 'rgba(37,99,235,0.07)', border: '1px solid rgba(37,99,235,0.25)', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '28px', flexShrink: 0 }}>🏛️</span>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#2563EB', marginBottom: '4px' }}>
              Promotions &amp; short-term access are only available in person.
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>
              Day passes, week passes, month memberships, and any active promotions must be purchased at the front desk.{' '}
              <a href="#booking" style={{ color: '#2563EB', fontWeight: 600, textDecoration: 'none' }}>
                Make an appointment today →
              </a>
            </div>
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginTop: '20px' }}>
          No hidden fees. No long-term contracts on monthly plans.
        </p>
      </div>
    </section>
  )
}
