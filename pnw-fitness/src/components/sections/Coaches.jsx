const coaches = [
  {
    initial: 'K',
    name: 'Keith',
    cert: 'NASM-CPT',
    specialty: 'Strength & Longevity',
    bio: 'Specializes in building long-term strength and sustainable fitness habits. Works with clients of all ages including those returning to fitness later in life.',
    tags: ['Strength', 'Longevity', 'Rehab'],
  },
  {
    initial: 'D',
    name: 'Dave',
    cert: 'NASM-CPT',
    specialty: 'Functional Movement',
    bio: 'Focuses on movement quality and functional fitness. Helps clients move better, feel better, and perform better in everyday life.',
    tags: ['Functional', 'Mobility', 'Athletic'],
  },
  {
    initial: 'J',
    name: 'Joel',
    cert: 'NASM-CSCS',
    specialty: 'Athletic Performance',
    bio: 'Certified Strength and Conditioning Specialist with a background in competitive athletics. Builds sport-specific programs for competitive athletes.',
    tags: ['Performance', 'Speed', 'Power'],
  },
  {
    initial: 'B',
    name: 'Bee',
    cert: 'RYT-500, NASM',
    specialty: 'Yoga, Pilates & Barre',
    bio: 'Brings a holistic approach to movement through yoga, Pilates, and barre. Focuses on fascia health, body awareness, and recovery.',
    tags: ['Yoga', 'Pilates', 'Recovery'],
  },
  {
    initial: 'P',
    name: 'Prabh',
    cert: 'NASM-CNC',
    specialty: 'Nutrition & Conditioning',
    bio: 'Certified Nutrition Coach who combines smart eating strategies with effective conditioning programs for total body transformation.',
    tags: ['Nutrition', 'Conditioning', 'Fat Loss'],
  },
]

export default function Coaches() {
  return (
    <section
      id="coaches"
      style={{
        padding: '100px 56px',
        background: '#0E2340',
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#C9A84C', display: 'block', marginBottom: '12px' }}>
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
            <span style={{ color: '#C9A84C', fontStyle: 'italic' }}>COACHES.</span>
          </h2>
          <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.45)', maxWidth: '500px', margin: '0 auto' }}>
            Every coach at PNW Fitness holds NASM credentials and builds programs around you.
          </p>
        </div>

        {/* Coaches grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '12px' }}>
          {coaches.map((c, i) => (
            <div
              key={c.name}
              style={{
                background: i % 2 === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '20px',
                padding: '28px 20px',
                textAlign: 'center',
                transition: 'border-color 0.25s, transform 0.25s',
                cursor: 'default',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'rgba(201,168,76,0.4)'
                e.currentTarget.style.transform = 'translateY(-4px)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              {/* Avatar */}
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: '#071829',
                  border: '2px solid rgba(201,168,76,0.25)',
                  margin: '0 auto 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'Barlow Condensed, sans-serif',
                  fontSize: '26px',
                  fontWeight: 900,
                  color: '#C9A84C',
                  transition: 'border-color 0.25s',
                }}
              >
                {c.initial}
              </div>
              <div
                style={{
                  fontFamily: 'Barlow Condensed, sans-serif',
                  fontSize: '20px',
                  fontWeight: 900,
                  color: '#fff',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  marginBottom: '4px',
                }}
              >
                {c.name}
              </div>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#C9A84C', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px' }}>
                {c.cert}
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', marginBottom: '14px' }}>
                {c.specialty}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'center' }}>
                {c.tags.map(tag => (
                  <span
                    key={tag}
                    style={{
                      fontSize: '9px',
                      fontWeight: 700,
                      padding: '3px 8px',
                      background: 'rgba(201,168,76,0.1)',
                      border: '1px solid rgba(201,168,76,0.2)',
                      borderRadius: '50px',
                      color: '#C9A84C',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
