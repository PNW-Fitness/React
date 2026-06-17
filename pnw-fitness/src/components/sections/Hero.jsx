import { useState, useEffect } from 'react'
import { ChevronRight, MapPin, Clock } from 'lucide-react'

const slides = [
  { title: 'Build', highlight: 'Strength.', quote: 'Whatever the mind of man can conceive and believe, it can achieve.', author: 'Napoleon Hill' },
  { title: 'Forge', highlight: 'Discipline.', quote: 'The secret of getting ahead is getting started.', author: 'Mark Twain' },
  { title: 'Unlock', highlight: 'Potential.', quote: 'It never gets easier, you just get stronger.', author: 'Unknown' },
]

// openAt / closeAt are minutes from midnight. closed: true = fully closed that day.
// regular: true = use normal weekday/weekend hours (no override).
const HOLIDAYS = [
  { year: 2026, month: 1,  day: 1,  openAt: 600,  closeAt: 1260, label: "New Year's Day"          },
  { year: 2026, month: 1,  day: 19, openAt: 540,  closeAt: 1140, label: "MLK Jr. Day"              },
  { year: 2026, month: 2,  day: 16, regular: true,               label: "Presidents' Day"          },
  { year: 2026, month: 4,  day: 5,  openAt: 480,  closeAt: 840,  label: "Easter"                   },
  { year: 2026, month: 5,  day: 25, openAt: 540,  closeAt: 1140, label: "Memorial Day"             },
  { year: 2026, month: 6,  day: 19, openAt: 540,  closeAt: 1140, label: "Juneteenth"               },
  { year: 2026, month: 6,  day: 27, openAt: 480,  closeAt: 840,  label: "Cap Hill Pride"           },
  { year: 2026, month: 6,  day: 28, openAt: 840,  closeAt: 1200, label: "Seattle Pride"            },
  { year: 2026, month: 7,  day: 4,  openAt: 480,  closeAt: 840,  label: "Independence Day"         },
  { year: 2026, month: 7,  day: 5,  openAt: 840,  closeAt: 1200, label: "Day After July 4th"       },
  { year: 2026, month: 9,  day: 7,  openAt: 540,  closeAt: 1140, label: "Labor Day"                },
  { year: 2026, month: 10, day: 12, openAt: 540,  closeAt: 1140, label: "Indigenous Peoples' Day"  },
  { year: 2026, month: 11, day: 11, openAt: 540,  closeAt: 1140, label: "Veterans Day"             },
  { year: 2026, month: 11, day: 26, openAt: 360,  closeAt: 840,  label: "Thanksgiving"             },
  { year: 2026, month: 11, day: 27, openAt: 780,  closeAt: 1260, label: "Black Friday"             },
  { year: 2026, month: 12, day: 24, openAt: 360,  closeAt: 840,  label: "Christmas Eve"            },
  { year: 2026, month: 12, day: 25, closed: true,                label: "Christmas Day"            },
  { year: 2026, month: 12, day: 26, openAt: 840,  closeAt: 1200, label: "Day After Christmas"      },
  { year: 2026, month: 12, day: 31, openAt: 360,  closeAt: 840,  label: "New Year's Eve"           },
  { year: 2027, month: 1,  day: 1,  openAt: 780,  closeAt: 1260, label: "New Year's Day"           },
]

const STATUS_COLOR = {
  open:           '#4ade80',
  'opening-soon': '#facc15',
  'closing-soon': '#facc15',
  closed:         '#f87171',
}

const STATUS_LABEL = {
  open:           'We Are Open',
  'opening-soon': 'Opening Soon',
  'closing-soon': 'Closing Soon',
  closed:         'Currently Closed',
}

function formatMins(mins) {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  const ampm = h >= 12 ? 'PM' : 'AM'
  const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h
  return m === 0 ? `${displayH}:00 ${ampm}` : `${displayH}:${String(m).padStart(2, '0')} ${ampm}`
}

function getTodayHoliday() {
  const now = new Date()
  return HOLIDAYS.find(h =>
    h.year === now.getFullYear() &&
    h.month === now.getMonth() + 1 &&
    h.day === now.getDate()
  ) || null
}

function getTodayWindow() {
  const holiday = getTodayHoliday()
  if (holiday && holiday.closed) return null
  if (holiday && !holiday.regular) return { openAt: holiday.openAt, closeAt: holiday.closeAt }
  const weekend = [0, 6].includes(new Date().getDay())
  return { openAt: weekend ? 480 : 360, closeAt: weekend ? 1200 : 1260 }
}

function getStatus() {
  const now = new Date()
  const mins = now.getHours() * 60 + now.getMinutes()
  const window = getTodayWindow()
  if (!window) return 'closed'
  const { openAt, closeAt } = window
  if (mins >= openAt && mins < closeAt - 15) return 'open'
  if (mins >= openAt - 15 && mins < openAt) return 'opening-soon'
  if (mins >= closeAt - 15 && mins < closeAt) return 'closing-soon'
  return 'closed'
}

function getTodayLabel() {
  const holiday = getTodayHoliday()
  if (holiday) return holiday.label
  return [0, 6].includes(new Date().getDay()) ? 'Saturday – Sunday' : 'Monday – Friday'
}

function getTodayHours() {
  const holiday = getTodayHoliday()
  if (holiday && holiday.closed) return 'Closed Today'
  const window = getTodayWindow()
  return `${formatMins(window.openAt)} – ${formatMins(window.closeAt)}`
}

export default function Hero({ onJoinClick }) {
  const [current, setCurrent] = useState(0)
  const status = getStatus()

  useEffect(() => {
    const t = setInterval(() => setCurrent(c => (c + 1) % slides.length), 5000)
    return () => clearInterval(t)
  }, [])

  const s = slides[current]

  return (
    <section id="home" style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#071829 0%,#0E2340 50%,#1B3A5C 100%)', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'flex-end', padding: '0 56px 80px' }}>

      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url(https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1600&q=70)', backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.18 }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(100deg,rgba(0,0,0,0.88) 40%,rgba(14,35,64,0.3) 100%)' }} />

      {/* Floating status card */}
      <div style={{ position: 'absolute', top: '100px', right: '56px', zIndex: 10, background: 'rgba(14,35,64,0.85)', backdropFilter: 'blur(16px)', border: '1px solid rgba(201,168,76,0.25)', borderRadius: '16px', padding: '18px 22px', minWidth: '230px' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <div style={{ position: 'relative', width: '12px', height: '12px', flexShrink: 0 }}>
            <div className="status-pulse" style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: STATUS_COLOR[status] }} />
            <div style={{ position: 'absolute', inset: '2px', borderRadius: '50%', background: STATUS_COLOR[status] }} />
          </div>
          <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: STATUS_COLOR[status] }}>
            {STATUS_LABEL[status]}
          </span>
        </div>

        <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', marginBottom: '14px' }} />

        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '12px' }}>
          <MapPin size={14} color="#C9A84C" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontSize: '12px', color: '#fff', fontWeight: 600, lineHeight: 1.5 }}>401 Broadway E</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>Seattle, WA 98102</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
          <Clock size={14} color="#C9A84C" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginBottom: '2px' }}>{getTodayLabel()}</div>
            <div style={{ fontSize: '12px', color: '#fff', fontWeight: 600 }}>{getTodayHours()}</div>
          </div>
        </div>

      </div>

      <div style={{ position: 'relative', zIndex: 2, maxWidth: '700px', width: '100%' }}>

        <h1 style={{ margin: '0 0 8px', lineHeight: 0.95 }}>
          <span style={{ display: 'block', color: '#fff', fontWeight: 900, fontFamily: 'Barlow Condensed, sans-serif', fontSize: 'clamp(72px,12vw,130px)', textTransform: 'uppercase' }}>
            {s.title}
          </span>
          <span style={{ display: 'block', color: '#C9A84C', fontWeight: 900, fontFamily: 'Barlow Condensed, sans-serif', fontSize: 'clamp(72px,12vw,130px)', textTransform: 'uppercase', fontStyle: 'italic' }}>
            {s.highlight}
          </span>
        </h1>

        <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.55)', fontStyle: 'italic', lineHeight: 1.7, maxWidth: '460px', marginBottom: '8px' }}>
          {s.quote}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
          <div style={{ width: '32px', height: '1px', background: '#C9A84C' }} />
          <span style={{ fontSize: '10px', fontWeight: 800, color: '#C9A84C', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
            {s.author}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
          <button onClick={onJoinClick} style={{ background: '#C9A84C', color: '#0E2340', border: 'none', padding: '14px 32px', borderRadius: '50px', fontWeight: 800, fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            Start Training <ChevronRight size={14} />
          </button>
          <a href="#services" style={{ background: 'transparent', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.25)', padding: '14px 32px', borderRadius: '50px', fontWeight: 600, fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none', display: 'inline-block' }}>
            View Services
          </a>
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: '32px', right: '56px', display: 'flex', alignItems: 'center', gap: '10px', zIndex: 2 }}>
        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', fontWeight: 700 }}>0{current + 1}</span>
        <div style={{ display: 'flex', gap: '6px' }}>
          {slides.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)} style={{ width: i === current ? '24px' : '6px', height: '6px', borderRadius: '3px', background: i === current ? '#C9A84C' : 'rgba(255,255,255,0.25)', border: 'none', cursor: 'pointer', padding: 0, transition: 'all 0.3s' }} />
          ))}
        </div>
      </div>

    </section>
  )
}
