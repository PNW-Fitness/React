import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, ExternalLink, CalendarDays, Loader2, AlertCircle } from 'lucide-react'

// ─── Config ──────────────────────────────────────────────────────────────────
const CALENDAR_ID   = '635db07ce214c29c1c6549a9a9b3161c727af1ecac59904c3ac27f47863d26ec@group.calendar.google.com'
const API_KEY       = import.meta.env.VITE_GOOGLE_CAL_API_KEY
const CLASSPASS_URL = 'https://classpass.com/studios/pacific-northwest-fitness-seattle'
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

// Coach name lives in the title: "Class Name w/Bee" or "Class Name with Bee"
function parseCoachFromTitle(title = '') {
  const m = title.match(/(?:with|w\/)\s*([A-Za-z]+)\s*$/i)
  return m ? m[1] : null
}

// Strip the coach suffix so the displayed title is clean
function cleanTitle(title = '') {
  return title.replace(/\s+(?:with|w\/)\s*[A-Za-z]+\s*$/i, '').trim()
}

// Parse cap from HTML description: "capped at 25 attendees"
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

// Returns next 7 days starting from today
function getWeek() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    return d
  })
}

const SHORT_DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function ClassesPage() {
  const [grouped, setGrouped]     = useState({})
  const [loading, setLoading]     = useState(!!API_KEY)  // skip loading if no key
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
        <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.75, maxWidth: '560px', margin: 0 }}>
          Our live schedule — updated in real time. Members get unlimited group classes included.
          Don't have a membership? Book a single class through ClassPass.
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
              <div style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#a78bfa', marginBottom: '3px' }}>No Membership? No Problem.</div>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '20px', fontWeight: 900, textTransform: 'uppercase', color: '#fff', marginBottom: '2px' }}>We're on ClassPass</div>
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
            const isToday = i === 0
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
      <div style={{ padding: '0 56px 80px', maxWidth: '1200px', margin: '0 auto' }}>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'rgba(255,255,255,0.3)' }}>
            <Loader2 size={32} style={{ margin: '0 auto 12px', display: 'block', animation: 'spin 1s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            <div style={{ fontSize: '14px' }}>Loading schedule…</div>
          </div>
        )}

        {/* No API key */}
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

        {/* API error */}
        {!loading && error && error !== 'no-key' && (
          <div style={{ background: '#0d1117', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '16px', padding: '32px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <AlertCircle size={20} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>Could not load schedule</div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>{error}</div>
            </div>
          </div>
        )}

        {/* Events */}
        {!loading && !error && (
          <>
            {dayEvents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 0' }}>
                <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.25)' }}>No classes scheduled for this day.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {dayEvents.map((evt, i) => {
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
                      key={evt.id || i}
                      style={{ display: 'grid', gridTemplateColumns: '110px 1fr auto', alignItems: 'center', gap: '20px', background: '#0d1117', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '20px 28px', transition: 'border-color 0.2s, transform 0.2s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(201,168,76,0.3)'; e.currentTarget.style.transform = 'translateX(4px)' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'translateX(0)' }}
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
                          <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff', marginBottom: '2px' }}>{title}</div>
                          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>
                            {coach && <>with {coach}</>}
                            {coach && duration && <>&nbsp;·&nbsp;</>}
                            {duration && <>{duration}</>}
                          </div>
                        </div>
                      </div>

                      {/* Cap */}
                      {cap && (
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>{cap} spots</div>
                          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', marginTop: '2px' }}>Members incl.</div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* Personal training CTA */}
        <div style={{ marginTop: '56px', background: '#0E2340', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '20px', padding: '40px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '24px' }}>
          <div>
            <div style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#C9A84C', marginBottom: '8px' }}>Personal Training</div>
            <h3 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '36px', fontWeight: 900, textTransform: 'uppercase', color: '#fff', margin: '0 0 8px' }}>Want a custom program?</h3>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.45)', margin: 0 }}>Work 1-on-1 with one of our NASM-certified coaches on your schedule.</p>
          </div>
          <Link to="/coaches" style={{ background: '#C9A84C', color: '#0E2340', textDecoration: 'none', padding: '14px 32px', borderRadius: '50px', fontWeight: 800, fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
            Meet the Coaches <ChevronRight size={14} />
          </Link>
        </div>
      </div>

    </div>
  )
}
