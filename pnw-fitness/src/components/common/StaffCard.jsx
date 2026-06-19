const BASE = import.meta.env.BASE_URL

export default function StaffCard({ staff: c, variant = 'teaser' }) {
  const isFull = variant === 'full'

  return (
    <div
      style={{
        position: 'relative',
        height: isFull ? '520px' : '380px',
        borderRadius: isFull ? '24px' : '20px',
        overflow: 'hidden',
        border: `1px solid ${isFull ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.07)'}`,
        transition: 'border-color 0.25s, transform 0.25s',
        cursor: 'default',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = `rgba(37,99,235,${isFull ? '0.35' : '0.4'})`
        e.currentTarget.style.transform = 'translateY(-4px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = `rgba(255,255,255,${isFull ? '0.06' : '0.07'})`
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      <PhotoBg
        photo={c.photo_url ? (c.photo_url.startsWith('http') ? c.photo_url : `${BASE}${c.photo_url}`) : null}
        initial={c.initial}
        isFull={isFull}
      />

      <div style={{
        position: 'absolute',
        inset: 0,
        background: isFull
          ? 'linear-gradient(to top, #000 0%, rgba(0,0,0,0.92) 45%, rgba(0,0,0,0.3) 65%, transparent 100%)'
          : 'linear-gradient(to top, #000 0%, rgba(0,0,0,0.75) 40%, rgba(0,0,0,0.1) 70%, transparent 100%)',
      }} />

      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: isFull ? '24px 22px' : '20px 18px' }}>
        <div style={{
          fontFamily: 'Barlow Condensed, sans-serif',
          fontSize: isFull ? '26px' : '22px',
          fontWeight: 900,
          color: '#fff',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          marginBottom: '2px',
        }}>
          {c.name}
        </div>

        <div style={{ fontSize: '10px', fontWeight: 700, color: '#2563EB', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: isFull ? '4px' : '6px' }}>
          {c.cert}
        </div>

        <div style={{
          fontSize: '11px',
          fontWeight: isFull ? 700 : 400,
          color: isFull ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.55)',
          textTransform: isFull ? 'uppercase' : 'none',
          letterSpacing: isFull ? '0.08em' : 0,
          marginBottom: '10px',
        }}>
          {c.specialty}
        </div>

        {isFull && c.bio && (
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
        )}

        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '4px',
          marginBottom: isFull ? '12px' : 0,
          ...(!isFull && { minHeight: '46px', alignContent: 'flex-start' }),
        }}>
          {(c.tags ?? []).map(tag => (
            <span
              key={tag}
              style={{
                fontSize: '9px',
                fontWeight: 700,
                padding: '3px 8px',
                background: 'rgba(37,99,235,0.15)',
                border: '1px solid rgba(37,99,235,0.3)',
                borderRadius: '50px',
                color: '#2563EB',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              {tag}
            </span>
          ))}
        </div>

        {isFull && c.classes_taught && c.classes_taught.length > 0 && (
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px' }}>
            <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em', textTransform: 'uppercase', marginRight: '8px' }}>
              Teaches
            </span>
            {c.classes_taught.map(cl => (
              <span key={cl} style={{ fontSize: '10px', color: 'rgba(255,255,255,0.45)', marginRight: '10px' }}>
                {cl}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function PhotoBg({ photo, initial, isFull }) {
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
      background: 'linear-gradient(135deg, #0d0d0d 0%, #141414 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <span style={{
        fontFamily: 'Barlow Condensed, sans-serif',
        fontSize: isFull ? '140px' : '100px',
        fontWeight: 900,
        color: `rgba(37,99,235,${isFull ? '0.1' : '0.12'})`,
        lineHeight: 1,
      }}>
        {initial}
      </span>
    </div>
  )
}
