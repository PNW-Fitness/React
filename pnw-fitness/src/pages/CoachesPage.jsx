import { ChevronRight } from 'lucide-react'

const BASE = import.meta.env.BASE_URL

const coaches = [
  {
    photo: `${BASE}coaches/Keith.jpg`,
    initial: 'K',
    name: 'Keith',
    cert: 'NASM-CPT',
    specialty: 'Strength & Longevity',
    bio: 'Specializes in building long-term strength and sustainable fitness habits. Keith works with clients of all ages, including those returning to fitness later in life. His programming focuses on progressive overload, joint health, and building routines that stick for the long haul.',
    tags: ['Strength', 'Longevity', 'Rehab'],
    classes: ['Strength & Conditioning', 'Power Hour'],
  },
  {
    photo: `${BASE}coaches/Dave.jpg`,
    initial: 'D',
    name: 'Dave',
    cert: 'NASM-CPT',
    specialty: 'Functional Movement',
    bio: 'Focuses on movement quality and functional fitness. Dave helps clients move better, feel better, and perform better in everyday life. His sessions combine mobility work, corrective exercise, and sport-inspired training to build bodies that are both strong and resilient.',
    tags: ['Functional', 'Mobility', 'Athletic'],
    classes: ['HIIT Bootcamp', 'Functional Fitness'],
  },
  {
    photo: `${BASE}coaches/Joel.jpg`,
    initial: 'J',
    name: 'Joel',
    cert: 'NASM-CSCS',
    specialty: 'Athletic Performance',
    bio: 'A Certified Strength and Conditioning Specialist with a background in competitive athletics. Joel builds sport-specific programs for competitive and recreational athletes focused on speed, power, and peak performance — and coaches the only boxing program in Capitol Hill.',
    tags: ['Performance', 'Speed', 'Boxing'],
    classes: ['Boxing Fundamentals', 'Athletic Performance', 'Power Hour'],
  },
  {
    photo: `${BASE}coaches/Bee.jpg`,
    initial: 'B',
    name: 'Bee',
    cert: 'RYT-500, NASM',
    specialty: 'Yoga, Pilates & Barre',
    bio: 'Brings a holistic approach to movement through yoga, Pilates, and barre. With her RYT-500 certification and NASM credentials, Bee focuses on fascia health, body awareness, and recovery — helping members feel as good between sessions as they do during them.',
    tags: ['Yoga', 'Pilates', 'Barre', 'Recovery'],
    classes: ['Yoga Flow', 'Pilates Core', 'Barre', 'Yoga Restore'],
  },
  {
    photo: `${BASE}coaches/Prabh.jpg`,
    initial: 'P',
    name: 'Prabh',
    cert: 'NASM-CNC',
    specialty: 'Nutrition & Conditioning',
    bio: 'A Certified Nutrition Coach who combines smart eating strategies with effective conditioning programs for total body transformation. Prabh runs our weekly Nutrition Workshop and coaches Spin, bringing the same data-driven mindset to both cardio and plate.',
    tags: ['Nutrition', 'Conditioning', 'Spin'],
    classes: ['Spin Class', 'Nutrition Workshop'],
  },
]

export default function CoachesPage({ onJoinClick }) {
  return (
    <div style={{ minHeight: '100vh', background: '#080C10', paddingTop: '100px' }}>

      {/* Page header */}
      <div style={{ padding: '60px 56px 72px', maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '40px', flexWrap: 'wrap' }}>
        <div>
          <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#C9A84C', display: 'block', marginBottom: '12px' }}>
            The Team
          </span>
          <h1 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 'clamp(56px,9vw,110px)', fontWeight: 900, textTransform: 'uppercase', lineHeight: 0.9, margin: '0 0 20px', color: '#fff' }}>
            MEET THE<br />
            <span style={{ color: '#C9A84C', fontStyle: 'italic' }}>COACHES.</span>
          </h1>
          <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.75, maxWidth: '520px', margin: 0 }}>
            Every coach at PNW Fitness holds NASM credentials and builds programs around you — not a template.
            Get to know the team, then book your first session.
          </p>
        </div>
        <button onClick={onJoinClick} style={{ background: '#C9A84C', color: '#0E2340', border: 'none', padding: '16px 36px', borderRadius: '50px', fontWeight: 800, fontSize: '13px', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap', flexShrink: 0 }}>
          Book a Session <ChevronRight size={14} />
        </button>
      </div>

      {/* Coach cards — 3-column grid */}
      <div style={{ padding: '0 56px 100px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {coaches.map((c) => (
            <CoachCard key={c.name} c={c} />
          ))}
        </div>

        {/* CTA banner */}
        <div style={{ marginTop: '64px', background: 'linear-gradient(135deg,#071829,#0E2340)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '20px', padding: '56px 48px', textAlign: 'center' }}>
          <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#C9A84C', display: 'block', marginBottom: '12px' }}>
            Ready to Start?
          </span>
          <h3 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 'clamp(36px,5vw,64px)', fontWeight: 900, textTransform: 'uppercase', color: '#fff', margin: '0 0 16px' }}>
            Train with the best.
          </h3>
          <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.45)', margin: '0 auto 32px', maxWidth: '480px' }}>
            Book your first session or join today and get unlimited access to all group classes.
          </p>
          <button onClick={onJoinClick} style={{ background: '#C9A84C', color: '#0E2340', border: 'none', padding: '16px 40px', borderRadius: '50px', fontWeight: 800, fontSize: '13px', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            Join Now <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

function CoachCard({ c }) {
  return (
    <div
      style={{
        position: 'relative',
        height: '520px',
        borderRadius: '24px',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.06)',
        transition: 'border-color 0.25s, transform 0.25s',
        cursor: 'default',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(201,168,76,0.35)'
        e.currentTarget.style.transform = 'translateY(-4px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {/* Background photo */}
      <PhotoBackground photo={c.photo} initial={c.initial} />

      {/* Gradient overlay — taller on coaches page to cover bio text */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(to top, #000 0%, rgba(0,0,0,0.92) 45%, rgba(0,0,0,0.3) 65%, transparent 100%)',
      }} />

      {/* Text at bottom */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '24px 22px' }}>
        <div style={{
          fontFamily: 'Barlow Condensed, sans-serif',
          fontSize: '26px',
          fontWeight: 900,
          color: '#fff',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          marginBottom: '2px',
        }}>
          {c.name}
        </div>
        <div style={{ fontSize: '10px', fontWeight: 700, color: '#C9A84C', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '4px' }}>
          {c.cert}
        </div>
        <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
          {c.specialty}
        </div>

        {/* Bio */}
        <p style={{
          fontSize: '12px',
          color: 'rgba(255,255,255,0.6)',
          lineHeight: 1.7,
          margin: '0 0 12px',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {c.bio}
        </p>

        {/* Tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '12px' }}>
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

        {/* Classes taught */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px' }}>
          <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em', textTransform: 'uppercase', marginRight: '8px' }}>Teaches</span>
          {c.classes.map(cl => (
            <span key={cl} style={{ fontSize: '10px', color: 'rgba(255,255,255,0.45)', marginRight: '10px' }}>{cl}</span>
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
        fontSize: '140px',
        fontWeight: 900,
        color: 'rgba(201,168,76,0.1)',
        lineHeight: 1,
      }}>
        {initial}
      </span>
    </div>
  )
}
