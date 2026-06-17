export default function Footer() {
  const links = {
    'Quick Links': ['Home', 'About', 'Programs', 'Coaches', 'Pricing'],
    'Services': ['Group Fitness', 'Personal Training', 'Yoga & Pilates', 'Boxing & HIIT', 'Corporate Wellness', 'Temp Passes'],
  }

  return (
    <footer style={{ background: '#0E2340', borderTop: '1px solid rgba(201,168,76,0.15)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '64px 56px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', gap: '48px', paddingBottom: '56px', borderBottom: '1px solid rgba(201,168,76,0.1)' }}>

          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{ width: '38px', height: '38px', background: '#C9A84C', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, color: '#0E2340' }}>
                PNW
              </div>
              <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '20px', fontWeight: 800, color: '#fff' }}>
                FITNESS<span style={{ color: '#C9A84C' }}>ZONE</span>
              </span>
            </div>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.38)', lineHeight: 1.8, marginBottom: '24px' }}>
              Seattle's premier health and fitness club in Capitol Hill. NASM-certified trainers, group classes daily, and a community that shows up for you.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              {['𝕏', 'f', '📷'].map((icon, i) => (
                <a
                  key={i}
                  href="#"
                  style={{
                    width: '36px',
                    height: '36px',
                    border: '1px solid rgba(201,168,76,0.2)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'rgba(255,255,255,0.4)',
                    textDecoration: 'none',
                    fontSize: '13px',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#C9A84C'; e.currentTarget.style.color = '#0E2340'; e.currentTarget.style.borderColor = '#C9A84C' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; e.currentTarget.style.borderColor = 'rgba(201,168,76,0.2)' }}
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(links).map(([heading, items]) => (
            <div key={heading}>
              <h3 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#fff', marginBottom: '20px', paddingBottom: '12px', position: 'relative' }}>
                {heading}
                <span style={{ position: 'absolute', bottom: 0, left: 0, width: '24px', height: '2px', background: '#C9A84C' }} />
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {items.map(item => (
                  <li key={item}>
                    <a
                      href="#"
                      style={{
                        fontSize: '13px',
                        color: 'rgba(255,255,255,0.4)',
                        textDecoration: 'none',
                        display: 'block',
                        padding: '6px 0',
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        transition: 'color 0.2s, padding-left 0.2s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#C9A84C'; e.currentTarget.style.paddingLeft = '6px' }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; e.currentTarget.style.paddingLeft = '0px' }}
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact */}
          <div>
            <h3 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#fff', marginBottom: '20px', paddingBottom: '12px', position: 'relative' }}>
              Contact
              <span style={{ position: 'absolute', bottom: 0, left: 0, width: '24px', height: '2px', background: '#C9A84C' }} />
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { icon: '📍', text: '401 Broadway E, Suite 301\nSeattle, WA 98102' },
                { icon: '📞', text: '(206) 322-2322' },
                { icon: '✉️', text: 'info@pnw-fitness.com' },
                { icon: '🕐', text: 'Mon–Fri: 6AM – 9PM\nSat–Sun: 8AM – 8PM' },
              ].map(item => (
                <li key={item.text} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '14px', flexShrink: 0 }}>{item.icon}</span>
                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                    {item.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ padding: '20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.22)', margin: 0 }}>
            © 2025 Pacific Northwest Fitness · 401 Broadway E, Seattle, WA
          </p>
          <p style={{ fontSize: '12px', fontWeight: 700, color: '#C9A84C', letterSpacing: '0.1em', margin: 0 }}>
            NASM APPROVED · SGN BEST GYM 2025
          </p>
        </div>
      </div>
    </footer>
  )
}
