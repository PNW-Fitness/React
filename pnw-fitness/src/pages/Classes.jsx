import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, ExternalLink, CalendarDays, Loader2, AlertCircle } from 'lucide-react'

// ─── Config ──────────────────────────────────────────────────────────────────
const CALENDAR_ID   = '635db07ce214c29c1c6549a9a9b3161c727af1ecac59904c3ac27f47863d26ec@group.calendar.google.com'
const API_KEY       = import.meta.env.VITE_GOOGLE_CAL_API_KEY
const CLASSPASS_URL = 'https://classpass.com/studios/pacific-northwest-fitness-seattle'
const BASE          = import.meta.env.BASE_URL
// ─────────────────────────────────────────────────────────────────────────────

const TYPE_COLOR = {
  Strength:    '#C9A84C',
  HIIT:        '#ef4444',
  Boxing:      '#f97316',
  Yoga:        '#a855f7',
  Pilates:     '#a855f7',
  Barre:       '#ec4899',
  Spin:        '#3b82f6',
  Mobility:    '#06b6d4',
  Nutrition:   '#14b8a6',
  Performance: '#64748b',
}

// Add / edit group fitness instructors here
const GROUP_INSTRUCTORS = [
  {
    photo: `${BASE}coaches/Bee.jpg`,
    initial: 'B',
    name: 'Bee',
    cert: 'RYT-500 · NASM',
    specialty: 'Yoga, Pilates & Barre',
    tags: ['Yoga', 'Pilates', 'Barre', 'Recovery'],
  },
  {
    photo: `${BASE}coaches/Marcus.jpg`,
    initial: 'M',
    name: 'Marcus',
    cert: 'NASM-CPT',
    specialty: 'Boxing & Conditioning',
    tags: ['Boxing', 'HIIT', 'Conditioning'],
  },
  {
    photo: `${BASE}coaches/Dana.jpg`,
    initial: 'D',
    name: 'Dana',
    cert: 'Certified Spin Instructor',
    specialty: 'Indoor Cycling',
    tags: ['Spin', 'Cardio', 'Endurance'],
  },
]

function detectType(title = '') {
  const t = title.toLowerCase()
  if (t.includes('barre'))                                                     return 'Barre'
  if (t.includes('pilates'))                                                   return 'Pilates'
  if (t.includes('yin') || t.includes('restorative') || t.includes('gentle yoga') || t.includes('yoga')) return 'Yoga'
  if (t.includes('mobility') || t.includes('unlock') || t.includes('stretch')) return 'Mobility'
  if (t.includes('spin') || t.includes('cycling') || t.includes('cycle'))     return 'Spin'
  if (t.includes('boxing') || t.includes('box'))                               return 'Boxing'
  if (t.includes('hiit') || t.includes('bootcamp'))                            return 'HIIT'
  if (t.includes('nutrition'))                                                 return 'Nutrition'
  if (t.includes('performance') || t.includes('athletic'))                    return 'Performance'
  if (t.includes('strength') || t.includes('conditioning') || t.includes('functional')) return 'Strength'
  return 'Strength'
}

function stripHtml(html = '') {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ').trim()
}

function parseCoachFromTitle(title = '') {
  const m = title.match(/(?:with|w\/)\s*([A-Za-z]+)\s*$/i)
  return m ? m[1] : null
}

function cleanTitle(title = '') {
  return title.replace(/\s+(?:with|w\/)\s*[A-Za-z]+\s*$/i, '').trim()
}

function parseCap(desc = '') {
  const m = stripHtml(desc).match(/capped at (\d+)/i)
  return m ? m[1] : null
}

function formatTime(dt) {
  return new Date(dt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function calcDuration(start, end) {
  const mins = Math.round((new Date(end) - new Date(start)) / 60000)
  if (mins < 60) return `${mins} min`
  const h = Math.floor(mins / 60), m = mins % 60
  return m ? `${h}h ${m}m` : `${h} hr`
}

function getWeek() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    return d
  })
}

const SHORT_DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// ─── Individual class event row ───────────────────────────────────────────────
function ClassEventCard({ evt, i }) {
  const [showDesc, setShowDesc] = useState(false)

  const isAllDay  = !evt.start.dateTime
  const type      = detectType(evt.summary || '')
  const color     = TYPE_COLOR[type]
  const coach     = parseCoachFromTitle(evt.summary || '')
  const title     = cleanTitle(evt.summary || '')
  const cap       = parseCap(evt.description || '')
  const desc      = evt.description ? stripHtml(evt.description).replace(/capped at \d+ attendees\.?\s*/i, '').trim() : null
  const time      = isAllDay ? 'All Day' : formatTime(evt.start.dateTime)
  const duration  = (!isAllDay && evt.end?.dateTime) ? calcDuration(evt.start.dateTime, evt.end.dateTime) : null

  return (
    <div style={{ position: 'relative' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '110px 1fr auto',
          alignItems: 'center',
          gap: '20px',
          background: '#0d1117',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '16px',
          padding: '20px 28px',
          transition: 'border-color 0.2s, transform 0.2s',
          cursor: desc ? 'pointer' : 'default',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = 'rgba(201,168,76,0.3)'
          e.currentTarget.style.transform = 'translateX(4px)'
          if (desc) setShowDesc(true)
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
          e.currentTarget.style.transform = 'translateX(0)'
          setShowDesc(false)
        }}
      >
        {/* Time */}
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '18px', fontWeight: 700, color: '#C9A84C' }}>
          {time}
        </div>

        {/* Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '4px 10px', borderRadius: '50px', background: `${color}22`, border: `1px solid ${color}55`, color, whiteSpace: 'nowrap' }}>
            {type}
          </span>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff', marginBottom: '3px' }}>{title}</div>
            <div style={{ fontSize: '12px', color: '#C9A84C', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {coach && <span>with {coach}</span>}
              {coach && duration && <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>}
              {duration && <span style={{ color: 'rgba(255,255,255,0.4)' }}>{duration}</span>}
            </div>
          </div>
        </div>

        {/* Limited spots badge */}
        {cap && (
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '50px', padding: '4px 10px', marginBottom: '4px' }}>
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />
              <span style={{ fontSize: '9px', fontWeight: 800, color: '#ef4444', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Limited</span>
            </div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)' }}>{cap} spots · Members incl.</div>
          </div>
        )}
      </div>

      {/* Description popover — pulls straight from Google Calendar */}
      {showDesc && desc && (
        <div
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 8px)',
            left: '20px',
            zIndex: 200,
            background: '#111820',
            border: '1px solid rgba(201,168,76,0.3)',
            borderRadius: '14px',
            padding: '16px 20px',
            maxWidth: '420px',
            minWidth: '200px',
            boxShadow: '0 16px 48px rgba(0,0,0,0.7)',
            pointerEvents: 'none',
          }}
        >
          {cap && (
            <div style={{ fontSize: '10px', fontWeight: 800, color: '#ef4444', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px' }}>
              Limited to {cap} spots
            </div>
          )}
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.72)', lineHeight: 1.7, margin: 0 }}>{desc}</p>
          {/* Caret arrow */}
          <div style={{ position: 'absolute', top: '100%', left: '32px', width: 0, height: 0, borderLeft: '7px solid transparent', borderRight: '7px solid transparent', borderTop: '7px solid rgba(201,168,76,0.3)' }} />
          <div style={{ position: 'absolute', top: 'calc(100% - 1px)', left: '32px', width: 0, height: 0, borderLeft: '7px solid transparent', borderRight: '7px solid transparent', borderTop: '7px solid #111820' }} />
        </div>
      )}
    </div>
  )
}

// ─── Instructor card (mirrors the personal trainer card style) ────────────────
function GroupInstructorCard({ c }) {
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
      {c.photo ? (
        <img
          src={c.photo}
          alt=""
          onError={e => { e.currentTarget.style.display = 'none' }}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }}
        />
      ) : (
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,#071829 0%,#0E2340 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '100px', fontWeight: 900, color: 'rgba(201,168,76,0.12)', lineHeight: 1 }}>{c.initial}</span>
        </div>
      )}

      {/* Gradient overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,#000 0%,rgba(0,0,0,0.75) 40%,rgba(0,0,0,0.1) 70%,transparent 100%)' }} />

      {/* Text at bottom */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 18px' }}>
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '22px', fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>
          {c.name}
        </div>
        <div style={{ fontSize: '10px', fontWeight: 700, color: '#C9A84C', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '6px' }}>
          {c.cert}
        </div>
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)', marginBottom: '10px' }}>
          {c.specialty}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', minHeight: '46px', alignContent: 'flex-start' }}>
          {c.tags.map(tag => (
            <span
              key={tag}
              style={{ fontSize: '9px', fontWeight: 700, padding: '3px 8px', background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: '50px', color: '#C9A84C', letterSpacing: '0.08em', textTransform: 'uppercase' }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ClassesPage() {
  const [grouped, setGrouped]     = useState({})
  const [loading, setLoading]     = useState(!!API_KEY)
  const [error, setError]         = useState(API_KEY ? null : 'no-key')
  const [activeDay, setActiveDay] = useState(0)

  const week = getWeek()

  useEffect(() => {
    if (!API_KEY) return

    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
    const timeMin = todayStart.toISOString()
    const timeMax = new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString()
    const url =
      `https://www.googleapis.com/calendar/v3/calendars/` +
      `${encodeURIComponent(CALENDAR_ID)}/events` +
      `?key=${API_KEY}` +
      `&timeMin=${timeMin}&timeMax=${timeMax}` +
      `&singleEvents=true&orderBy=startTime&maxResults=200`

    fetch(url)
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error.message)
        const g = {}
        ;(data.items || []).forEach(evt => {
          const date = (evt.start.dateTime || evt.start.date).slice(0, 10)
          if (!g[date]) g[date] = []
          g[date].push(evt)
        })
        setGrouped(g)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  const selectedDateStr = week[activeDay].toISOString().slice(0, 10)
  const dayEvents = grouped[selectedDateStr] || []

  return (
    <div style={{ minHeight: '100vh', background: '#080C10', paddingTop: '100px' }}>

      {/* Page header */}
      <div style={{ padding: '60px 56px 48px', maxWidth: '1200px', margin: '0 auto' }}>
        <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#C9A84C', display: 'block', marginBottom: '12px' }}>
          Schedule
        </span>
        <h1 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 'clamp(56px,9vw,110px)', fontWeight: 900, textTransform: 'uppercase', lineHeight: 0.9, margin: '0 0 20px', color: '#fff' }}>
          CALENDAR &<br />
          <span style={{ color: '#C9A84C', fontStyle: 'italic' }}>CLASSES.</span>
        </h1>
        <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.75, maxWidth: '600px', margin: 0 }}>
          Our live schedule is updated in real time. Members get unlimited group classes included as space allows.
          Don't have a membership? We offer day and week passes for drop-ins!
        </p>
      </div>

      {/* ClassPass banner */}
      <div style={{ padding: '0 56px 48px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ background: 'linear-gradient(135deg,#1a1042 0%,#2d1b69 50%,#1a1042 100%)', border: '1px solid rgba(139,92,246,0.35)', borderRadius: '20px', padding: '28px 36px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(139,92,246,0.25)', border: '1px solid rgba(139,92,246,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CalendarDays size={22} color="#a78bfa" />
            </div>
            <div>
              <div style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#a78bfa', marginBottom: '3px' }}>Already on ClassPass?</div>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '20px', fontWeight: 900, textTransform: 'uppercase', color: '#fff', marginBottom: '2px' }}>Try us out!</div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>Drop in to any class — no commitment, pay per visit.</div>
            </div>
          </div>
          <a
            href={CLASSPASS_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#7c3aed', color: '#fff', textDecoration: 'none', padding: '12px 26px', borderRadius: '50px', fontWeight: 800, fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#6d28d9')}
            onMouseLeave={e => (e.currentTarget.style.background = '#7c3aed')}
          >
            Book on ClassPass <ExternalLink size={13} />
          </a>
        </div>
      </div>

      {/* Day tabs */}
      <div style={{ padding: '0 56px', maxWidth: '1200px', margin: '0 auto 32px' }}>
        <div style={{ display: 'flex', gap: '6px', background: 'rgba(255,255,255,0.04)', borderRadius: '16px', padding: '6px', width: 'fit-content' }}>
          {week.map((date, i) => {
            const isToday  = i === 0
            const isActive = i === activeDay
            return (
              <button
                key={i}
                onClick={() => setActiveDay(i)}
                style={{ padding: '10px 18px', borderRadius: '10px', fontSize: '12px', fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'all 0.2s', background: isActive ? '#0E2340' : 'transparent', color: isActive ? '#fff' : 'rgba(255,255,255,0.4)', outline: isActive ? '1px solid rgba(201,168,76,0.35)' : 'none', position: 'relative', lineHeight: 1.3, textAlign: 'center' }}
              >
                <span style={{ display: 'block', fontSize: '11px' }}>{SHORT_DAY[date.getDay()]}</span>
                <span style={{ display: 'block', fontSize: '15px', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900 }}>{date.getDate()}</span>
                {isToday && <span style={{ position: 'absolute', top: '4px', right: '4px', width: '5px', height: '5px', borderRadius: '50%', background: '#C9A84C' }} />}
              </button>
            )
          })}
        </div>
      </div>

      {/* Class list */}
      <div style={{ padding: '0 56px 100px', maxWidth: '1200px', margin: '0 auto' }}>

        {loading && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'rgba(255,255,255,0.3)' }}>
            <Loader2 size={32} style={{ margin: '0 auto 12px', display: 'block', animation: 'spin 1s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            <div style={{ fontSize: '14px' }}>Loading schedule…</div>
          </div>
        )}

        {!loading && error === 'no-key' && (
          <div style={{ background: '#0d1117', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '16px', padding: '40px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <AlertCircle size={20} color="#C9A84C" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>Google Calendar API key not set</div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.7 }}>
                Add your API key to <code style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 6px', borderRadius: '4px', fontSize: '12px' }}>.env.local</code> as <code style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 6px', borderRadius: '4px', fontSize: '12px' }}>VITE_GOOGLE_CAL_API_KEY=your_key</code>, then restart the dev server.
              </div>
            </div>
          </div>
        )}

        {!loading && error && error !== 'no-key' && (
          <div style={{ background: '#0d1117', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '16px', padding: '32px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <AlertCircle size={20} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>Could not load schedule</div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>{error}</div>
            </div>
          </div>
        )}

        {!loading && !error && (
          <>
            {dayEvents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 0' }}>
                <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.25)' }}>No classes scheduled for this day.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {dayEvents.map((evt, i) => (
                  <ClassEventCard key={evt.id || i} evt={evt} i={i} />
                ))}
              </div>
            )}
          </>
        )}

        {/* Personal Training CTA */}
        <div style={{ marginTop: '56px', background: '#0E2340', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '20px', padding: '40px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '24px' }}>
          <div>
            <div style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#C9A84C', marginBottom: '8px' }}>Personal Training</div>
            <h3 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '36px', fontWeight: 900, textTransform: 'uppercase', color: '#fff', margin: '0 0 8px' }}>Want a custom program?</h3>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.45)', margin: 0 }}>Work 1-on-1 with one of our certified personal trainers on your schedule.</p>
          </div>
          <Link to="/coaches" style={{ background: '#C9A84C', color: '#0E2340', textDecoration: 'none', padding: '14px 32px', borderRadius: '50px', fontWeight: 800, fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
            Meet the Coaches <ChevronRight size={14} />
          </Link>
        </div>

        {/* Group Fitness Instructors */}
        <div style={{ marginTop: '72px' }}>
          <div style={{ marginBottom: '40px' }}>
            <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#C9A84C', display: 'block', marginBottom: '12px' }}>
              Group Classes
            </span>
            <h2
              style={{
                fontFamily: 'Barlow Condensed, sans-serif',
                fontSize: 'clamp(40px,6vw,72px)',
                fontWeight: 900,
                textTransform: 'uppercase',
                lineHeight: 0.95,
                margin: '0 0 16px',
              }}
            >
              <span style={{ color: '#fff' }}>MEET YOUR</span>
              <br />
              <span style={{ color: '#C9A84C', fontStyle: 'italic' }}>INSTRUCTORS.</span>
            </h2>
            <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.45)', maxWidth: '500px', margin: 0, lineHeight: 1.75 }}>
              World-class instruction across yoga, boxing, cycling, and more — unlimited with membership.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px' }}>
            {GROUP_INSTRUCTORS.map(c => (
              <GroupInstructorCard key={c.name} c={c} />
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
