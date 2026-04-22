import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

function categoryFor(monthly: number) {
  if (monthly < 50)   return 'Sleeper'
  if (monthly < 150)  return 'Idle Earner'
  if (monthly < 400)  return 'Yield Curious'
  if (monthly < 1000) return 'Onchain Saver'
  if (monthly < 3000) return 'DeFi Native'
  return 'Whale Asleep'
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const monthly  = parseFloat(searchParams.get('monthly') ?? '0')
  const category = searchParams.get('category') || categoryFor(monthly)
  const total    = monthly.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const INK    = '#0A0B1A'
  const BLUE   = '#2E70EA'
  const SKY    = '#A3C5FE'
  const GREEN  = '#10B981'
  const MUTED  = 'rgba(255,255,255,0.55)'

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200, height: 630,
          background: INK,
          display: 'flex', flexDirection: 'column',
          padding: '56px 64px',
          position: 'relative',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Grid dots */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `radial-gradient(rgba(46,112,234,0.18) 1.5px, transparent 1.5px)`,
          backgroundSize: '36px 36px',
          display: 'flex',
        }}/>
        {/* Glow */}
        <div style={{
          position: 'absolute', top: -140, right: -140,
          width: 560, height: 560,
          background: `radial-gradient(circle, rgba(46,112,234,0.4) 0%, transparent 70%)`,
          borderRadius: '50%',
          display: 'flex',
        }}/>

        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 2 }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#fff', letterSpacing: '-1px' }}>earny</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 999, fontSize: 13, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.85)' }}>
            <div style={{ width: 6, height: 6, background: GREEN, borderRadius: '50%', display: 'flex' }}/>
            Your Onchain CFO
          </div>
        </div>

        {/* Body */}
        <div style={{ marginTop: 32, position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column' }}>
          {/* Category badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 18px', background: `linear-gradient(90deg, rgba(46,112,234,0.2), rgba(46,112,234,0))`, border: `1px solid rgba(46,112,234,0.35)`, borderRadius: 999, fontSize: 14, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: SKY, marginBottom: 20, width: 'fit-content' }}>
            <div style={{ width: 6, height: 6, background: GREEN, borderRadius: '50%', display: 'flex' }}/>
            {category.toUpperCase()}
          </div>

          {/* "I'm leaving" */}
          <div style={{ fontSize: 26, color: MUTED, fontStyle: 'italic', marginBottom: 10, display: 'flex' }}>I&apos;m leaving</div>

          {/* Big number */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 110, color: 'rgba(255,255,255,0.55)', fontWeight: 300, lineHeight: 1 }}>$</span>
            <span style={{ fontSize: 200, fontWeight: 700, color: '#fff', lineHeight: 0.9, letterSpacing: '-4px' }}>{total}</span>
            <span style={{ fontSize: 72, color: MUTED, fontStyle: 'italic', lineHeight: 1 }}>/mo</span>
          </div>

          {/* Subtitle */}
          <div style={{ fontSize: 28, color: 'rgba(255,255,255,0.8)', fontStyle: 'italic', marginTop: 16, display: 'flex' }}>
            on the table. Earny showed me where.
          </div>
        </div>

        {/* Footer */}
        <div style={{ position: 'absolute', bottom: 48, left: 64, right: 64, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', zIndex: 2 }}>
          <div style={{ fontSize: 20, color: MUTED, fontStyle: 'italic', display: 'flex' }}>earny.chat — read-only, never moves your funds.</div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.18em', textTransform: 'uppercase', display: 'flex' }}>Check yours →</div>
            <div style={{ fontSize: 30, fontWeight: 700, color: '#fff', display: 'flex' }}>earny.chat</div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
