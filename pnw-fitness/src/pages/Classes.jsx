import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, ExternalLink, CalendarDays, Loader2, AlertCircle } from 'lucide-react'
import StaffCard from '../components/common/StaffCard'
import { supabase } from '../lib/supabaseClient'

// ─── Config ──────────────────────────────────────────────────────────────────
const CALENDAR_ID   = '635db07ce214c29c1c6549a9a9b3161c727af1ecac59904c3ac27f47863d26ec@group.calendar.google.com'
const API_KEY       = import.meta.env.VITE_GOOGLE_CAL_API_KEY
const CLASSPASS_URL = 'https://classpass.com/studios/pacific-northwest-fitness-seattle'
const BASE          = import.meta.env.BASE_URL
// ─────────────────────────────────────────────────────────────────────────────

const TYPE_COLOR = {
  Strength:    '#2563EB',
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

function toLocalDateStr(d) {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-')
}

// ─── Individual class event row ───────────────────────────────────────────────
function ClassEventCard({ evt, onHover, onLeave }) {
  const isAllDay = !evt.start.dateTime
  const type     = detectType(evt.summary || '')
  const color    = TYPE_COLOR[type]
  const coach    = parseCoachFromTitle(evt.summary || '')
  const title    = cleanTitle(evt.summary || '')
  const cap      = parseCap(evt.description || '')
  const time     = isAllDay ? 'All Day' : formatTime(evt.start.dateTime)
  const duration = (!isAllDay && evt.end?.dateTime) ? calcDuration(evt.start.dateTime, evt.end.dateTime) : null

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '88px 100px 1fr auto',
        alignItems: 'center',
        gap: '20px',
        background: '#111111',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '16px',
        padding: '20px 28px',
        transition: 'border-color 0.2s, transform 0.2s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(37,99,235,0.3)'
        e.currentTarget.style.transform = 'translateX(4px)'
        onHover(evt)
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
        e.currentTarget.style.transform = 'translateX(0)'
        onLeave()
      }}
    >
      {/* Time */}
      <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '18px', fontWeight: 700, color: '#2563EB', textAlign: 'right' }}>
        {time}
      </div>

      {/* Badge — own column for alignment */}
      <div>
        <span style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '4px 10px', borderRadius: '50px', background: `${color}22`, border: `1px solid ${color}55`, color, whiteSpace: 'nowrap' }}>
          {type}
        </span>
      </div>

      {/* Title + coach */}
      <div>
        <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff', marginBottom: '3px' }}>{title}</div>
        <div style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          {coach    && <span style={{ color: '#2563EB' }}>with {coach}</span>}
          {coach && duration && <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>}
          {duration && <span style={{ color: 'rgba(255,255,255,0.35)' }}>{duration}</span>}
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
  )
}

// ─── Fixed side panel — appears on the right when hovering a class row ────────
function EventSidePanel({ evt, onEnter, onLeave }) {
  const type     = detectType(evt.summary || '')
  const color    = TYPE_COLOR[type]
  const coach    = parseCoachFromTitle(evt.summary || '')
  const title    = cleanTitle(evt.summary || '')
  const cap      = parseCap(evt.description || '')
  const desc     = evt.description
    ? stripHtml(evt.description).replace(/capped at \d+ attendees\.?\s*/i, '').trim()
    : null
  const isAllDay = !evt.start.dateTime
  const time     = isAllDay ? 'All Day' : formatTime(evt.start.dateTime)
  const duration = (!isAllDay && evt.end?.dateTime) ? calcDuration(evt.start.dateTime, evt.end.dateTime) : null

  return (
    <div
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      style={{
        position: 'fixed',
        right: '28px',
        top: '50%',
        transform: 'translateY(-50%)',
        width: '280px',
        background: '#111111',
        border: '1px solid rgba(37,99,235,0.35)',
        borderRadius: '20px',
        padding: '28px 24px',
        zIndex: 300,
        boxShadow: '0 24px 64px rgba(0,0,0,0.75)',
      }}
    >
      {/* Type badge + time */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <span style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '4px 10px', borderRadius: '50px', background: `${color}22`, border: `1px solid ${color}55`, color }}>
          {type}
        </span>
        <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '14px', fontWeight: 700, color: '#2563EB' }}>
          {time}
        </span>
      </div>

      {/* Title */}
      <h3 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '28px', fontWeight: 900, textTransform: 'uppercase', color: '#fff', margin: '0 0 6px', lineHeight: 1.05 }}>
        {title}
      </h3>

      {/* Coach + duration */}
      {(coach || duration) && (
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '18px' }}>
          {coach && `with ${coach}`}
          {coach && duration && ' · '}
          {duration}
        </div>
      )}

      {/* Description */}
      {desc ? (
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.62)', lineHeight: 1.72, margin: cap ? '0 0 16px' : 0 }}>
          {desc}
        </p>
      ) : (
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.22)', fontStyle: 'italic', margin: cap ? '0 0 16px' : 0 }}>
          No description available.
        </p>
      )}

      {/* Cap */}
      {cap && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 13px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '10px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#ef4444' }}>
            Limited to {cap} spots · Members included
          </span>
        </div>
      )}
    </div>
  )
}


// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ClassesPage() {
  const [grouped, setGrouped]               = useState({})
  const [loading, setLoading]               = useState(!!API_KEY)
  const [error, setError]                   = useState(API_KEY ? null : 'no-key')
  const [activeDay, setActiveDay]           = useState(0)
  const [hoveredEvt, setHoveredEvt]         = useState(null)
  const [groupInstructors, setGroupInstructors] = useState([])
  const closeTimer = useRef(null)

  const week = getWeek()

  function scheduleClose() {
    closeTimer.current = setTimeout(() => setHoveredEvt(null), 175)
  }
  function cancelClose() {
    clearTimeout(closeTimer.current)
  }

  useEffect(() => {
    supabase
      .from('staff_roles')
      .select('display_order, classes_taught, staff!inner(id, name, photo_url, initial, cert, specialty, bio, tags, active)')
      .eq('role', 'group_instructor')
      .order('display_order')
      .then(({ data }) => {
        if (data) setGroupInstructors(data.map(r => ({ ...r.staff, classes_taught: r.classes_taught })))
      })
  }, [])

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

  const selectedDateStr = toLocalDateStr(week[activeDay])
  const dayEvents = grouped[selectedDateStr] || []

  return (
    <>
    <div style={{ minHeight: '100vh', background: '#0a0a0a', paddingTop: '100px' }}>

      {/* Page header */}
      <div style={{ padding: '60px 56px 48px', maxWidth: '1200px', margin: '0 auto' }}>
        <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#2563EB', display: 'block', marginBottom: '12px' }}>
          Schedule
        </span>
        <h1 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 'clamp(56px,9vw,110px)', fontWeight: 900, textTransform: 'uppercase', lineHeight: 0.9, margin: '0 0 20px', color: '#fff' }}>
          CALENDAR &<br />
          <span style={{ color: '#2563EB', fontStyle: 'italic' }}>CLASSES.</span>
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
                style={{ padding: '10px 18px', borderRadius: '10px', fontSize: '12px', fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'all 0.2s', background: isActive ? '#141414' : 'transparent', color: isActive ? '#fff' : 'rgba(255,255,255,0.4)', outline: isActive ? '1px solid rgba(37,99,235,0.35)' : 'none', position: 'relative', lineHeight: 1.3, textAlign: 'center' }}
              >
                <span style={{ display: 'block', fontSize: '11px' }}>{SHORT_DAY[date.getDay()]}</span>
                <span style={{ display: 'block', fontSize: '15px', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900 }}>{date.getDate()}</span>
                {isToday && <span style={{ position: 'absolute', top: '4px', right: '4px', width: '5px', height: '5px', borderRadius: '50%', background: '#2563EB' }} />}
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
          <div style={{ background: '#111111', border: '1px solid rgba(37,99,235,0.2)', borderRadius: '16px', padding: '40px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <AlertCircle size={20} color="#2563EB" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>Google Calendar API key not set</div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.7 }}>
                Add your API key to <code style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 6px', borderRadius: '4px', fontSize: '12px' }}>.env.local</code> as <code style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 6px', borderRadius: '4px', fontSize: '12px' }}>VITE_GOOGLE_CAL_API_KEY=your_key</code>, then restart the dev server.
              </div>
            </div>
          </div>
        )}

        {!loading && error && error !== 'no-key' && (
          <div style={{ background: '#111111', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '16px', padding: '32px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
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
                  <ClassEventCard
                    key={evt.id || i}
                    evt={evt}
                    onHover={e => { cancelClose(); setHoveredEvt(e) }}
                    onLeave={scheduleClose}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Personal Training CTA */}
        <div style={{ marginTop: '56px', background: '#141414', border: '1px solid rgba(37,99,235,0.2)', borderRadius: '20px', padding: '40px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '24px' }}>
          <div>
            <div style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#2563EB', marginBottom: '8px' }}>Personal Training</div>
            <h3 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '36px', fontWeight: 900, textTransform: 'uppercase', color: '#fff', margin: '0 0 8px' }}>Want a custom program?</h3>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.45)', margin: 0 }}>Work 1-on-1 with one of our certified personal trainers on your schedule.</p>
          </div>
          <Link to="/trainers" style={{ background: '#2563EB', color: '#fff', textDecoration: 'none', padding: '14px 32px', borderRadius: '50px', fontWeight: 800, fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
            Meet the Trainers <ChevronRight size={14} />
          </Link>
        </div>

        {/* Group Fitness Instructors */}
        <div style={{ marginTop: '72px' }}>
          <div style={{ marginBottom: '40px' }}>
            <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#2563EB', display: 'block', marginBottom: '12px' }}>
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
              <span style={{ color: '#2563EB', fontStyle: 'italic' }}>INSTRUCTORS.</span>
            </h2>
            <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.45)', maxWidth: '500px', margin: 0, lineHeight: 1.75 }}>
              World-class instruction across yoga, boxing, cycling, and more — unlimited with membership.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px' }}>
            {groupInstructors.map(c => (
              <StaffCard key={c.id} staff={c} variant="teaser" />
            ))}
          </div>
        </div>

      </div>
    </div>

    {/* Hover description panel — fixed to right side of screen */}
    {hoveredEvt && <EventSidePanel evt={hoveredEvt} onEnter={cancelClose} onLeave={scheduleClose} />}
    </>
  )
}
