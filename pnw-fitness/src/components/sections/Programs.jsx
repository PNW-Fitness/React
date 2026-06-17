const services = [
  {
    icon: '🏋️',
    name: 'Strength Training',
    sub: 'All Levels',
    desc: 'Build raw strength and muscle with progressive overload programs. Barbells, dumbbells, machines — everything you need.',
  },
  {
    icon: '🔥',
    name: 'Cardio & HIIT',
    sub: 'Group Class',
    desc: 'Boost endurance and burn fat with high-intensity interval training. Classes capped at 20 — every spot coached.',
  },
  {
    icon: '🥊',
    name: 'Boxing',
    sub: 'Limited Spots',
    desc: 'Fundamentals through advanced combinations with Coach Marcus. Mon / Wed at 5:30 PM — only 12 spots per session.',
  },
  {
    icon: '🧘',
    name: 'Yoga & Pilates',
    sub: 'Group Class',
    desc: 'Coach Bee brings RYT-500 expertise to daily yoga flow, barre, and Pilates sessions focused on movement quality.',
  },
  {
    icon: '🚴',
    name: 'Spin Class',
    sub: 'Group Class',
    desc: 'High-energy cycling with Coach Dana. Tue / Thu / Sat at 6:00 PM in our dedicated 22-bike spin studio.',
  },
  {
    icon: '⭐',
    name: 'Personal Training',
    sub: '1-on-1',
    desc: 'Get a customized roadmap to your goals with one of our NASM-certified coaches. Your schedule, your program.',
  },
]

export default function Programs() {
  return (
    <section id="services" style={{ padding: '100px 56px', background: '#080C10' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#C9A84C' }}>
            What We Offer
          </span>
        </div>
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 'clamp(56px,9vw,110px)', fontWeight: 900, textTransform: 'uppercase', lineHeight: 0.95, margin: 0 }}>
            <span style={{ color: '#fff' }}>OUR</span>
            <br />
            <span style={{ background: 'linear-gradient(90deg,#C9A84C 0%,#E8D5A0 35%,#0E2340 65%,#C9A84C 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              SERVICES.
            </span>
          </h2>
        </div>
        <p style={{ textAlign: 'center', fontSize: '15px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.75, maxWidth: '600px', margin: '0 auto 56px' }}>
          Specialized services designed for every stage of life and fitness goal.
          Whether you want elite performance or are just starting out, we have the right path for you.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px' }}>
          {services.map(p => (
            <div
              key={p.name}
              style={{ background: '#111820', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '24px', padding: '32px 28px', transition: 'border-color 0.25s, transform 0.25s', cursor: 'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(201,168,76,0.4)'; e.currentTarget.style.transform = 'translateY(-4px)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <div style={{ width: '64px', height: '64px', background: 'rgba(14,35,64,0.8)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', marginBottom: '20px' }}>
                {p.icon}
              </div>
              <div style={{ fontSize: '10px', fontWeight: 800, color: '#C9A84C', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '8px' }}>
                {p.sub}
              </div>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '22px', fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px' }}>
                {p.name}
              </div>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, margin: 0 }}>
                {p.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
