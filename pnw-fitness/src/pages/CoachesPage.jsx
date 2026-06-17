import { ChevronRight } from 'lucide-react'

const coaches = [
  {
    initial: 'K',
    name: 'Keith',
    cert: 'NASM-CPT',
    specialty: 'Strength & Longevity',
    bio: 'Specializes in building long-term strength and sustainable fitness habits. Keith works with clients of all ages, including those returning to fitness later in life. His programming focuses on progressive overload, joint health, and building routines that stick for the long haul.',
    tags: ['Strength', 'Longevity', 'Rehab'],
    classes: ['Strength & Conditioning', 'Power Hour'],
  },
  {
    initial: 'D',
    name: 'Dave',
    cert: 'NASM-CPT',
    specialty: 'Functional Movement',
    bio: 'Focuses on movement quality and functional fitness. Dave helps clients move better, feel better, and perform better in everyday life. His sessions combine mobility work, corrective exercise, and sport-inspired training to build bodies that are both strong and resilient.',
    tags: ['Functional', 'Mobility', 'Athletic'],
    classes: ['HIIT Bootcamp', 'Functional Fitness'],
  },
  {
    initial: 'J',
    name: 'Joel',
    cert: 'NASM-CSCS',
    specialty: 'Athletic Performance',
    bio: 'A Certified Strength and Conditioning Specialist with a background in competitive athletics. Joel builds sport-specific programs for competitive and recreational athletes focused on speed, power, and peak performance — and coaches the only boxing program in Capitol Hill.',
    tags: ['Performance', 'Speed', 'Boxing'],
    classes: ['Boxing Fundamentals', 'Athletic Performance', 'Power Hour'],
  },
  {
    initial: 'B',
    name: 'Bee',
    cert: 'RYT-500, NASM',
    specialty: 'Yoga, Pilates & Barre',
    bio: 'Brings a holistic approach to movement through yoga, Pilates, and barre. With her RYT-500 certification and NASM credentials, Bee focuses on fascia health, body awareness, and recovery — helping members feel as good between sessions as they do during them.',
    tags: ['Yoga', 'Pilates', 'Barre', 'Recovery'],
    classes: ['Yoga Flow', 'Pilates Core', 'Barre', 'Yoga Restore'],
  },
  {
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

      {/* Coach cards */}
      <div style={{ padding: '0 56px 100px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {coaches.map((c, i) => (
            <div
              key={c.name}
              style={{
                display: 'grid',
                gridTemplateColumns: '200px 1fr',
                background: i % 2 === 0 ? '#0d1117' : '#0E2340',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '24px',
                overflow: 'hidden',
                transition: 'border-color 0.25s',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(201,168,76,0.35)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)')}
            >
              {/* Left column — avatar */}
              <div style={{ background: i % 2 === 0 ? '#0E2340' : '#071829', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#071829', border: '2px solid rgba(201,168,76,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Barlow Condensed, sans-serif', fontSize: '36px', fontWeight: 900, color: '#C9A84C', marginBottom: '14px' }}>
                  {c.initial}
                </div>
                <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '22px', fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px', textAlign: 'center' }}>
                  {c.name}
                </div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#C9A84C', letterSpacing: '0.12em', textTransform: 'uppercase', textAlign: 'center' }}>
                  {c.cert}
                </div>
              </div>

              {/* Right column — details */}
              <div style={{ padding: '36px 40px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#C9A84C', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '6px' }}>
                  {c.specialty}
                </div>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.8, margin: '0 0 20px', maxWidth: '640px' }}>
                  {c.bio}
                </p>

                {/* Tags */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}>
                  {c.tags.map(tag => (
                    <span key={tag} style={{ fontSize: '9px', fontWeight: 700, padding: '4px 10px', background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '50px', color: '#C9A84C', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Classes taught */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px' }}>
                  <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em', textTransform: 'uppercase', marginRight: '12px' }}>Teaches</span>
                  {c.classes.map(cl => (
                    <span key={cl} style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginRight: '16px' }}>{cl}</span>
                  ))}
                </div>
              </div>
            </div>
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
