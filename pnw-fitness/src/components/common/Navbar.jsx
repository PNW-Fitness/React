import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'

const navLinks = [
  { name: 'Home',               to: '/'        },
  { name: 'Calendar & Classes', to: '/classes' },
  { name: 'Trainers',           to: '/trainers' },
  { name: 'About Us',           href: '/#about'},
]

export default function Navbar({ onJoinClick, onTourClick }) {
  const [open, setOpen]                         = useState(false)
  const [scrolled, setScrolled]                 = useState(false)
  const [announcements, setAnnouncements]       = useState([])
  const [announcementIdx, setAnnouncementIdx]   = useState(0)
  const [announcementCollapsed, setCollapsed]   = useState(false)
  const { pathname } = useLocation()

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => {
    supabase
      .from('announcements')
      .select('message')
      .eq('active', true)
      .order('display_order')
      .then(({ data }) => { if (data) setAnnouncements(data.map(r => r.message)) })
  }, [])

  const navStyle = {
    position: 'fixed',
    top: '16px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 1000,
    width: '95%',
    maxWidth: '1100px',
    background: scrolled ? 'rgba(20,20,20,0.97)' : 'rgba(20,20,20,0.80)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(37,99,235,0.25)',
    borderRadius: '50px',
    padding: '0 12px 0 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '60px',
    transition: 'all 0.3s ease',
  }

  const btnStyle = {
    background: '#2563EB',
    color: '#fff',
    border: 'none',
    padding: '10px 22px',
    borderRadius: '50px',
    fontWeight: 800,
    fontSize: '12px',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    cursor: 'pointer',
  }

  const tourBtnStyle = {
    background: 'transparent',
    color: 'rgba(255,255,255,0.8)',
    border: '1px solid rgba(255,255,255,0.25)',
    padding: '9px 18px',
    borderRadius: '50px',
    fontWeight: 600,
    fontSize: '11px',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  }

  function renderLink(l, mobile = false) {
    const isActive = l.to ? pathname === l.to : false
    const baseColor = isActive ? '#2563EB' : 'rgba(255,255,255,0.65)'
    const mobileColor = isActive ? '#2563EB' : 'rgba(255,255,255,0.7)'

    const desktopStyle = { color: baseColor, textDecoration: 'none', fontSize: '13px', fontWeight: 600, letterSpacing: '0.06em', transition: 'color 0.2s' }
    const mobileStyle = { display: 'block', padding: '12px 0', color: mobileColor, textDecoration: 'none', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.06)' }
    const style = mobile ? mobileStyle : desktopStyle

    const hoverOn  = e => { if (!mobile) e.target.style.color = '#2563EB' }
    const hoverOff = e => { if (!mobile) e.target.style.color = baseColor }

    const closeMenu = mobile ? () => setOpen(false) : undefined

    if (l.to) {
      return <Link key={l.name} to={l.to} style={style} onClick={closeMenu} onMouseEnter={hoverOn} onMouseLeave={hoverOff}>{l.name}</Link>
    }
    return <a key={l.name} href={l.href} style={style} onClick={closeMenu} onMouseEnter={hoverOn} onMouseLeave={hoverOff}>{l.name}</a>
  }

  const hasBanner = announcements.length > 0 && !announcementCollapsed

  function dismissAnnouncement() {
    if (announcementIdx < announcements.length - 1) {
      setAnnouncementIdx(i => i + 1)
    } else {
      setCollapsed(true)
    }
  }

  return (
    <>
      <nav style={navStyle}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <img src={`${import.meta.env.BASE_URL}pnw-logo.png`} alt="PNW Fitness" style={{ height: '36px', width: 'auto', display: 'block' }} />
          <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: '20px', color: '#fff' }}>
            FITNESS<span style={{ color: '#2563EB' }}></span>
          </span>
        </Link>

        <div style={{ display: 'flex', gap: '28px', alignItems: 'center' }}>
          {navLinks.map(l => renderLink(l))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Collapsed announcement badge */}
          {announcements.length > 0 && announcementCollapsed && (
            <button
              onClick={() => { setCollapsed(false); setAnnouncementIdx(0) }}
              title="Show announcement"
              style={{
                background: 'rgba(37,99,235,0.15)',
                border: '1px solid rgba(37,99,235,0.35)',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                cursor: 'pointer',
                fontSize: '15px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              📣
            </button>
          )}
          <button onClick={onTourClick} style={tourBtnStyle}>Schedule a Tour</button>
          <button onClick={onJoinClick} style={btnStyle}>Join Now</button>
          <button onClick={() => setOpen(!open)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', padding: '8px' }}>
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {open && (
          <div style={{ position: 'absolute', top: '68px', left: 0, right: 0, background: 'rgba(20,20,20,0.97)', borderRadius: '20px', padding: '20px', border: '1px solid rgba(37,99,235,0.2)' }}>
            {navLinks.map(l => renderLink(l, true))}
            <button onClick={() => { setOpen(false); onTourClick() }} style={{ ...tourBtnStyle, marginTop: '16px', width: '100%', border: '1px solid rgba(37,99,235,0.4)', color: '#2563EB' }}>
              Schedule a Tour
            </button>
            <button onClick={() => { setOpen(false); onJoinClick() }} style={{ ...btnStyle, marginTop: '8px', width: '100%' }}>
              Join Now
            </button>
          </div>
        )}
      </nav>

      {/* Announcements banner */}
      {hasBanner && (
        <div
          style={{
            position: 'fixed',
            top: '82px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '95%',
            maxWidth: '1100px',
            background: 'rgba(37,99,235,0.97)',
            backdropFilter: 'blur(8px)',
            borderRadius: '12px',
            padding: '10px 16px 10px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            zIndex: 999,
            boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
            animation: 'slideDown 0.3s ease',
          }}
        >
          <span style={{ color: '#fff', fontSize: '13px', fontWeight: 600, lineHeight: 1.4 }}>
            📣 {announcements[announcementIdx]}
          </span>
          <button
            onClick={dismissAnnouncement}
            style={{
              background: 'rgba(20,20,20,0.15)',
              border: 'none',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              cursor: 'pointer',
              color: '#fff',
              fontSize: '18px',
              fontWeight: 700,
              lineHeight: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>
      )}
    </>
  )
}
