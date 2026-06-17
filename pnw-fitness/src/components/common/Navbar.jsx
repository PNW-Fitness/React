import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, Dumbbell } from 'lucide-react'

const navLinks = [
  { name: 'Home',               to: '/'        },
  { name: 'Calendar & Classes', to: '/classes' },
  { name: 'Coaches',            to: '/coaches' },
  { name: 'About Us',           href: '/#about'},
]

export default function Navbar({ onJoinClick }) {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const navStyle = {
    position: 'fixed',
    top: '16px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 1000,
    width: '95%',
    maxWidth: '1100px',
    background: scrolled ? 'rgba(14,35,64,0.97)' : 'rgba(14,35,64,0.80)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(201,168,76,0.25)',
    borderRadius: '50px',
    padding: '0 12px 0 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '60px',
    transition: 'all 0.3s ease',
  }

  const btnStyle = {
    background: '#C9A84C',
    color: '#0E2340',
    border: 'none',
    padding: '10px 22px',
    borderRadius: '50px',
    fontWeight: 800,
    fontSize: '12px',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    cursor: 'pointer',
  }

  function renderLink(l, mobile = false) {
    const isActive = l.to ? pathname === l.to : false
    const baseColor = isActive ? '#C9A84C' : 'rgba(255,255,255,0.65)'
    const mobileColor = isActive ? '#C9A84C' : 'rgba(255,255,255,0.7)'

    const desktopStyle = { color: baseColor, textDecoration: 'none', fontSize: '13px', fontWeight: 600, letterSpacing: '0.06em', transition: 'color 0.2s' }
    const mobileStyle = { display: 'block', padding: '12px 0', color: mobileColor, textDecoration: 'none', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.06)' }
    const style = mobile ? mobileStyle : desktopStyle

    const hoverOn  = e => { if (!mobile) e.target.style.color = '#C9A84C' }
    const hoverOff = e => { if (!mobile) e.target.style.color = baseColor }

    const closeMenu = mobile ? () => setOpen(false) : undefined

    if (l.to) {
      return <Link key={l.name} to={l.to} style={style} onClick={closeMenu} onMouseEnter={hoverOn} onMouseLeave={hoverOff}>{l.name}</Link>
    }
    return <a key={l.name} href={l.href} style={style} onClick={closeMenu} onMouseEnter={hoverOn} onMouseLeave={hoverOff}>{l.name}</a>
  }

  return (
    <nav style={navStyle}>
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
        <div style={{ width: '36px', height: '36px', background: '#C9A84C', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Dumbbell size={18} color="#0E2340" />
        </div>
        <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: '20px', color: '#fff' }}>
          PNW<span style={{ color: '#C9A84C' }}>FITNESS</span>
        </span>
      </Link>

      <div style={{ display: 'flex', gap: '28px', alignItems: 'center' }}>
        {navLinks.map(l => renderLink(l))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button onClick={onJoinClick} style={btnStyle}>Join Now</button>
        <button onClick={() => setOpen(!open)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', padding: '8px' }}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div style={{ position: 'absolute', top: '68px', left: 0, right: 0, background: 'rgba(14,35,64,0.97)', borderRadius: '20px', padding: '20px', border: '1px solid rgba(201,168,76,0.2)' }}>
          {navLinks.map(l => renderLink(l, true))}
          <button onClick={onJoinClick} style={{ ...btnStyle, marginTop: '16px', width: '100%' }}>Join Now</button>
        </div>
      )}
    </nav>
  )
}
