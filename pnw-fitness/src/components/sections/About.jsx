export default function About({ onNasmClick }) {
  const features = [
    { num: '01', title: 'NASM Approved', desc: 'The only NASM-Approved Facility in Capitol Hill — the highest standard in fitness.' },
    { num: '02', title: 'Expert Trainers', desc: 'Every trainer holds fitness credentials and builds programs around your specific goals.' },
    { num: '03', title: 'Community First', desc: 'We believe fitness is better together. Every member is known by name here.' },
    { num: '04', title: 'Largest Facility', desc: 'Over 22,000 sq ft of training space — the biggest independent gym in the neighborhood.' },
  ]

  const stats = [
    { n: '22K+', l: 'Sq Ft' },
    { n: '15+', l: 'Years' },
    { n: 'NASM', l: 'Approved' },
    { n: '#1', l: 'SGN 2025' },
  ]

  return (
    <section
      id="about"
      style={{
        padding: '100px 56px',
        background: '#111111',
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '64px' }}>
          <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#2563EB', display: 'block', marginBottom: '12px' }}>
            Who We Are
          </span>
          <h2
            style={{
              fontFamily: 'Barlow Condensed, sans-serif',
              fontSize: 'clamp(48px,7vw,90px)',
              fontWeight: 900,
              textTransform: 'uppercase',
              color: '#fff',
              lineHeight: 0.95,
              margin: '0 0 24px',
            }}
          >
            A Welcoming Place<br />
            <span style={{ color: '#2563EB', fontStyle: 'italic' }}>To Transform.</span>
          </h2>
          <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.8, maxWidth: '600px' }}>
            Located at 401 Broadway E in Capitol Hill — above QFC — Pacific Northwest Fitness has been
            Seattle's home for serious training since 2010. Our mission is simple: provide a welcoming,
            inspiring environment where anyone can pursue their fitness goals.
          </p>
        </div>

        {/* Two column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '64px', alignItems: 'start' }}>

          {/* Features */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
            {features.map(f => (
              <div key={f.num}>
                <div
                  style={{
                    fontFamily: 'Barlow Condensed, sans-serif',
                    fontSize: '42px',
                    fontWeight: 900,
                    color: '#2563EB',
                    lineHeight: 1,
                    marginBottom: '8px',
                  }}
                >
                  {f.num}
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                  {f.title}
                </div>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.7 }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Right side — hours + stats */}
          <div>
            {/* Stats bar */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4,1fr)',
                background: '#2563EB',
                marginBottom: '24px',
              }}
            >
              {stats.map((s, i) => (
                <div
                  key={i}
                  style={{
                    padding: '20px 16px',
                    textAlign: 'center',
                    borderRight: i < stats.length - 1 ? '1px solid rgba(255,255,255,0.2)' : 'none',
                  }}
                >
                  <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '28px', fontWeight: 900, color: '#fff', lineHeight: 1 }}>
                    {s.n}
                  </div>
                  <div style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.65)', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: '4px' }}>
                    {s.l}
                  </div>
                </div>
              ))}
            </div>

            {/* Hours card */}
            <div
              style={{
                background: '#141414',
                padding: '32px',
                border: '1px solid rgba(37,99,235,0.15)',
              }}
            >
              <div style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#2563EB', marginBottom: '24px' }}>
                Hours of Operation
              </div>
              {[
                { days: 'Monday – Friday', time: '6:00 AM – 9:00 PM' },
                { days: 'Saturday – Sunday', time: '8:00 AM – 8:00 PM' },
              ].map(h => (
                <div
                  key={h.days}
                  style={{
                    borderBottom: '1px solid rgba(255,255,255,0.07)',
                    paddingBottom: '16px',
                    marginBottom: '16px',
                  }}
                >
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>
                    {h.days}
                  </div>
                  <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '24px', fontWeight: 700, color: '#fff' }}>
                    {h.time}
                  </div>
                </div>
              ))}
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>
                Last access 15 min before close
              </div>
              <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.7 }}>
                  401 Broadway E, Suite 301<br />
                  Seattle, WA 98102<br />
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}>Above QFC · Capitol Hill</span>
                </div>
                <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '20px', fontWeight: 700, color: '#2563EB', marginTop: '10px' }}>
                  (206) 322-2322
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* NASM Partnership CTA */}
        <div style={{ marginTop: '48px', background: '#141414', border: '1px solid rgba(37,99,235,0.15)', borderRadius: '16px', padding: '28px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px', flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#2563EB', margin: '0 0 6px' }}>NASM-Approved Facility</p>
            <p style={{ fontSize: '15px', fontWeight: 700, color: '#fff', margin: '0 0 4px' }}>Interested in NASM Certification?</p>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>Enroll in a course directly through PNW Fitness.</p>
          </div>
          <button
            onClick={onNasmClick}
            style={{ background: 'transparent', color: '#2563EB', border: '1px solid rgba(37,99,235,0.5)', padding: '12px 28px', borderRadius: '50px', fontWeight: 700, fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
          >
            Enroll in a Course →
          </button>
        </div>

      </div>
    </section>
  )
}
