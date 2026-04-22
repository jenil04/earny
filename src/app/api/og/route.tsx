import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import { SERIF_REGULAR_B64, SERIF_ITALIC_B64, FUNNEL_BOLD_B64 } from './fonts'

export const runtime = 'edge'

function categoryFor(monthly: number) {
  if (monthly < 50)   return 'Sleeper'
  if (monthly < 150)  return 'Idle Earner'
  if (monthly < 400)  return 'Yield Curious'
  if (monthly < 1000) return 'Onchain Saver'
  if (monthly < 3000) return 'DeFi Native'
  return 'Whale Asleep'
}

function b64ToBuffer(b64: string): ArrayBuffer {
  const binary = atob(b64)
  const buf = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) buf[i] = binary.charCodeAt(i)
  return buf.buffer
}

// Shared image is crawled by many user agents (Twitter/X, Farcaster, etc.) and
// the URL is attacker-controlled. Validate and clamp every input so we can't
// be coerced into rendering huge numbers or arbitrary strings.
const MAX_MONTHLY = 10_000_000

function sanitizeCategory(raw: string | null): string | null {
  if (!raw) return null
  // Strip control chars, cap length, whitelist printable ASCII + space.
  const cleaned = raw.replace(/[^\x20-\x7E]/g, '').trim().slice(0, 40)
  return cleaned.length > 0 ? cleaned : null
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const rawMonthly = searchParams.get('monthly')
  const parsed     = rawMonthly != null ? Number(rawMonthly) : 0
  const monthly    = Number.isFinite(parsed) ? Math.max(0, Math.min(MAX_MONTHLY, parsed)) : 0
  const category   = sanitizeCategory(searchParams.get('category')) ?? categoryFor(monthly)
  const total      = monthly.toFixed(2)

  const serifData       = b64ToBuffer(SERIF_REGULAR_B64)
  const serifItalicData = b64ToBuffer(SERIF_ITALIC_B64)
  const displayData     = b64ToBuffer(FUNNEL_BOLD_B64)

  const INK   = '#0A0B1A'
  const BLUE2 = '#2E70EA'
  const SKY   = '#A3C5FE'
  const GREEN = '#10B981'
  const MUTED = 'rgba(255,255,255,0.55)'
  const DIM   = 'rgba(255,255,255,0.38)'

  const image = new ImageResponse(
    (
      <div
        style={{
          width: 1200, height: 630,
          background: INK,
          display: 'flex',
          flexDirection: 'column',
          padding: '56px 64px 48px',
          position: 'relative',
          overflow: 'hidden',
          fontFamily: '"FunnelDisplay"',
        }}
      >
        {/* Grid dots overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `radial-gradient(rgba(46,112,234,0.2) 1.5px, transparent 1.5px)`,
          backgroundSize: '36px 36px',
          display: 'flex',
          opacity: 0.8,
        }}/>
        {/* Top-right glow */}
        <div style={{
          position: 'absolute', top: -160, right: -160,
          width: 600, height: 600,
          background: `radial-gradient(circle, rgba(46,112,234,0.45) 0%, transparent 68%)`,
          borderRadius: '50%',
          display: 'flex',
        }}/>

        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 2, width: '100%' }}>
          <span style={{ fontSize: 36, fontWeight: 700, color: '#fff', fontFamily: '"FunnelDisplay"', letterSpacing: '-1px' }}>earny</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 999, fontSize: 13, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.85)', fontFamily: '"FunnelDisplay"' }}>
            <div style={{ width: 7, height: 7, background: GREEN, borderRadius: '50%', display: 'flex' }}/>
            Your Onchain CFO
          </div>
        </div>

        {/* Body */}
        <div style={{ marginTop: 36, position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', flex: 1 }}>
          {/* Category badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 18px', background: `rgba(46,112,234,0.18)`, border: `1px solid rgba(46,112,234,0.4)`, borderRadius: 999, marginBottom: 22, width: 'fit-content' }}>
            <div style={{ width: 7, height: 7, background: GREEN, borderRadius: '50%', display: 'flex' }}/>
            <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: SKY, fontFamily: '"FunnelDisplay"' }}>{category.toUpperCase()}</span>
          </div>

          {/* "I'm leaving" */}
          <span style={{ fontSize: 28, color: MUTED, fontStyle: 'italic', display: 'flex', fontFamily: '"InstrumentSerif"', marginBottom: 8 }}>I&apos;m leaving</span>

          {/* Big number row */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: 120, color: DIM, fontFamily: '"InstrumentSerif"', lineHeight: 1, fontWeight: 400 }}>$</span>
            <span style={{ fontSize: 210, fontFamily: '"InstrumentSerif"', color: '#fff', lineHeight: 0.9, fontWeight: 400, letterSpacing: '-4px' }}>{total}</span>
            <span style={{ fontSize: 76, color: MUTED, fontStyle: 'italic', fontFamily: '"InstrumentSerif"', lineHeight: 1 }}>/mo</span>
          </div>

          {/* Subtitle */}
          <span style={{ fontSize: 30, color: 'rgba(255,255,255,0.82)', fontStyle: 'italic', marginTop: 18, display: 'flex', fontFamily: '"InstrumentSerif"' }}>
            on the table. Earny showed me where.
          </span>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', position: 'relative', zIndex: 2, width: '100%' }}>
          <span style={{ fontSize: 20, color: MUTED, fontStyle: 'italic', fontFamily: '"InstrumentSerif"' }}>earny.chat · read-only, never moves your funds.</span>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: '"FunnelDisplay"' }}>Check yours →</span>
            <span style={{ fontSize: 32, fontWeight: 700, color: '#fff', fontFamily: '"FunnelDisplay"' }}>earny.chat</span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: 'InstrumentSerif', data: serifData,       style: 'normal', weight: 400 },
        { name: 'InstrumentSerif', data: serifItalicData, style: 'italic', weight: 400 },
        { name: 'FunnelDisplay',   data: displayData,     style: 'normal', weight: 700 },
      ],
    }
  )
  // Output is deterministic from query params; cache aggressively so crawlers
  // (Twitter/X, Farcaster, etc.) don't re-render fonts on every hit.
  image.headers.set('Cache-Control', 'public, max-age=31536000, s-maxage=31536000, immutable')
  return image
}
