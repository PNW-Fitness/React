const services = [
  {
    icon: '🏋️',
    name: 'Strength Training',
    sub: 'Full Gym Access',
    desc: 'Free weights, machines, cables, and more across 22,000 sq ft of premium equipment — built for every level.',
  },
  {
    icon: '🤸',
    name: 'Group Fitness',
    sub: 'Group Classes',
    desc: 'HIIT, Boxing, Yoga, Pilates, Spin, and more. Unlimited classes are included with every membership.',
  },
  {
    icon: '⭐',
    name: 'Personal Training',
    sub: '1-on-1',
    desc: 'NASM-certified coaches build a custom program around your goals, schedule, and fitness history.',
  },
  {
    icon: '☀️',
    name: 'Tanning',
    sub: 'UV Beds & Spray',
    desc: 'Premium UV tanning beds and spray-tan booth available for members and short-term guests.',
  },
  {
    icon: '🥤',
    name: 'Grab & Go',
    sub: 'Snacks & Drinks',
    desc: 'Protein bars, shakes, electrolytes, and cold drinks — everything you need to fuel and recover.',
  },
  {
    icon: '🎟️',
    name: 'Short-Term Access',
    sub: 'Day · Week · Month',
    desc: 'Not ready to commit? Day, week, and month passes are available in person at the front desk.',
  },
]

export default function Programs() {
  return (
    <section id="services" style={{ padding: '100px 56px', background: '#0a0a0a' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#2563EB' }}>
            What We Offer
          </span>
        </div>
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 'clamp(56px,9vw,110px)', fontWeight: 900, textTransform: 'uppercase', lineHeight: 0.95, margin: 0 }}>
            <span style={{ color: '#fff' }}>OUR</span>
            <br />
            <span style={{ background: 'linear-gradient(90deg,#2563EB 0%,#93C5FD 35%,#141414 65%,#2563EB 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
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
              style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '24px', padding: '32px 28px', transition: 'border-color 0.25s, transform 0.25s', cursor: 'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(37,99,235,0.4)'; e.currentTarget.style.transform = 'translateY(-4px)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <div style={{ width: '64px', height: '64px', background: 'rgba(20,20,20,0.8)', border: '1px solid rgba(37,99,235,0.15)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', marginBottom: '20px' }}>
                {p.icon}
              </div>
              <div style={{ fontSize: '10px', fontWeight: 800, color: '#2563EB', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '8px' }}>
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
