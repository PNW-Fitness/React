const coaches = [
  {
    photo: '/coaches/keith.jpg',
    initial: 'K',
    name: 'Keith',
    cert: 'NASM-CPT',
    specialty: 'Strength & Longevity',
    tags: ['Strength', 'Longevity', 'Rehab'],
  },
  {
    photo: '/coaches/dave.jpg',
    initial: 'D',
    name: 'Dave',
    cert: 'NASM-CPT',
    specialty: 'Functional Movement',
    tags: ['Functional', 'Mobility', 'Athletic'],
  },
  {
    photo: '/coaches/joel.jpg',
    initial: 'J',
    name: 'Joel',
    cert: 'NASM-CSCS',
    specialty: 'Athletic Performance',
    tags: ['Performance', 'Speed', 'Power'],
  },
  {
    photo: '/coaches/bee.jpg',
    initial: 'B',
    name: 'Bee',
    cert: 'RYT-500, NASM',
    specialty: 'Yoga, Pilates & Barre',
    tags: ['Yoga', 'Pilates', 'Recovery'],
  },
  {
    photo: '/coaches/prabh.jpg',
    initial: 'P',
    name: 'Prabh',
    cert: 'NASM-CNC',
    specialty: 'Nutrition & Conditioning',
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
          {coaches.map((c) => (
            <CoachCard key={c.name} c={c} />
          ))}
        </div>
      </div>
    </section>
  )
}

function CoachCard({ c }) {
  return (
    <div
      style={{
        position: 'relative',
        height: '380px',
        borderRadius: '20px',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.07)',
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
      {/* Background photo */}
      <PhotoBackground photo={c.photo} initial={c.initial} />

      {/* Gradient overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(to top, #000 0%, rgba(0,0,0,0.75) 40%, rgba(0,0,0,0.1) 70%, transparent 100%)',
      }} />

      {/* Text at bottom */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 18px' }}>
        <div style={{
          fontFamily: 'Barlow Condensed, sans-serif',
          fontSize: '22px',
          fontWeight: 900,
          color: '#fff',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          marginBottom: '2px',
        }}>
          {c.name}
        </div>
        <div style={{ fontSize: '10px', fontWeight: 700, color: '#C9A84C', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '6px' }}>
          {c.cert}
        </div>
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)', marginBottom: '10px' }}>
          {c.specialty}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {c.tags.map(tag => (
            <span
              key={tag}
              style={{
                fontSize: '9px',
                fontWeight: 700,
                padding: '3px 8px',
                background: 'rgba(201,168,76,0.15)',
                border: '1px solid rgba(201,168,76,0.3)',
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
    </div>
  )
}

function PhotoBackground({ photo, initial }) {
  if (photo) {
    return (
      <img
        src={photo}
        alt=""
        onError={e => { e.currentTarget.style.display = 'none' }}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'top center',
        }}
      />
    )
  }
  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      background: 'linear-gradient(135deg, #071829 0%, #0E2340 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <span style={{
        fontFamily: 'Barlow Condensed, sans-serif',
        fontSize: '100px',
        fontWeight: 900,
        color: 'rgba(201,168,76,0.12)',
        lineHeight: 1,
      }}>
        {initial}
      </span>
    </div>
  )
}
