import { useState } from 'react'

const plans = [
  {
    name: 'Basic',
    priceMonthly: 39,
    priceYearly: 33,
    popular: false,
    features: [
      'Full gym floor access',
      'Locker rooms & showers',
      'Open 6AM – 9PM daily',
      '1 guest pass per month',
      'Access to stretching zone',
    ],
  },
  {
    name: 'Premier',
    priceMonthly: 59,
    priceYearly: 49,
    popular: true,
    features: [
      'Everything in Basic',
      'Unlimited group classes',
      'NASM trainer consultation',
      'Priority equipment booking',
      'Tanning services included',
    ],
  },
  {
    name: 'Elite',
    priceMonthly: 89,
    priceYearly: 74,
    popular: false,
    features: [
      'Everything in Premier',
      '2 personal training sessions/mo',
      'Nutrition guidance session',
      'Unlimited guest passes',
      'Early access to new programs',
    ],
  },
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: !yearly ? '#C9A84C' : 'rgba(255,255,255,0.4)' }}>
              Monthly
            </span>
            <button
              onClick={() => setYearly(!yearly)}
              style={{
                width: '52px',
                height: '28px',
                borderRadius: '50px',
                border: 'none',
                background: '#C9A84C',
                cursor: 'pointer',
                position: 'relative',
                transition: 'background 0.2s',
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
            <span style={{ fontSize: '13px', fontWeight: 700, color: yearly ? '#C9A84C' : 'rgba(255,255,255,0.4)' }}>
              Yearly
              <span style={{ marginLeft: '8px', fontSize: '10px', background: 'rgba(201,168,76,0.15)', color: '#C9A84C', padding: '2px 8px', borderRadius: '50px', border: '1px solid rgba(201,168,76,0.3)' }}>
                Save 15%
              </span>
            </span>
          </div>
        </div>

        {/* Plan cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px', alignItems: 'center' }}>
          {plans.map(plan => (
            <div
              key={plan.name}
              style={{
                background: plan.popular ? '#0E2340' : 'rgba(255,255,255,0.03)',
                border: plan.popular ? '1px solid #C9A84C' : '1px solid rgba(255,255,255,0.08)',
                borderRadius: '32px',
                padding: '40px 32px',
                position: 'relative',
                transform: plan.popular ? 'scale(1.04)' : 'scale(1)',
                boxShadow: plan.popular ? '0 30px 60px rgba(201,168,76,0.12)' : 'none',
              }}
            >
              {plan.popular && (
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
              )}

              <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#C9A84C', marginBottom: '16px' }}>
                {plan.name}
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '32px' }}>
                <span
                  style={{
                    fontFamily: 'Barlow Condensed, sans-serif',
                    fontSize: '56px',
                    fontWeight: 900,
                    color: '#fff',
                    lineHeight: 1,
                  }}
                >
                  ${yearly ? plan.priceYearly : plan.priceMonthly}
                </span>
                <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>/mo</span>
              </div>

              <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.08)', marginBottom: '28px' }} />

              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px' }}>
                {plan.features.map(f => (
                  <li
                    key={f}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '8px 0',
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      fontSize: '13px',
                      color: 'rgba(255,255,255,0.7)',
                    }}
                  >
                    <span style={{ color: '#C9A84C', fontWeight: 800, fontSize: '14px' }}>✓</span>
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
                  border: plan.popular ? 'none' : '1px solid rgba(255,255,255,0.2)',
                  background: plan.popular ? '#C9A84C' : 'transparent',
                  color: plan.popular ? '#0E2340' : '#fff',
                  fontWeight: 800,
                  fontSize: '11px',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => {
                  if (!plan.popular) {
                    e.currentTarget.style.background = '#C9A84C'
                    e.currentTarget.style.color = '#0E2340'
                    e.currentTarget.style.borderColor = '#C9A84C'
                  }
                }}
                onMouseLeave={e => {
                  if (!plan.popular) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = '#fff'
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'
                  }
                }}
              >
                Choose {plan.name}
              </button>
            </div>
          ))}
        </div>

        <p style={{ textAlign: 'center', fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginTop: '32px' }}>
          No contracts. Cancel anytime. First month free when you sign up today.
        </p>
      </div>
    </section>
  )
}
