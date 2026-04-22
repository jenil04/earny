'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { Opportunity, AnalyzeResult, Rate } from '@/types'

// ── Palette ──────────────────────────────────────────────────────────────────
const INK       = '#0A0B1A'
const BLUE      = '#196DFD'
const BLUE_2    = '#2E70EA'
const BLUE_DEEP = '#0A4EC2'
const BLUE_TINT = '#E8F0FF'
const BLUE_SOFT = '#D1E2FF'
const SKY       = '#A3C5FE'
const CREAM     = '#FBFAF4'
const PAPER     = '#F6F9FE'
const INK_MUTED = 'rgba(10,11,26,0.62)'
const INK_DIM   = 'rgba(10,11,26,0.38)'
const GREEN     = '#10B981'

// ── Responsive hook ───────────────────────────────────────────────────────────
function useIsMobile(bp = 768) {
  const [mobile, setMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${bp - 1}px)`)
    setMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [bp])
  return mobile
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatAddr(a: string) {
  if (!a) return '—'
  if (a.startsWith('0x') && a.length > 12) return a.slice(0, 10) + '…' + a.slice(-6)
  return a
}

function categoryFor(monthly: number) {
  if (monthly < 50)   return 'Sleeper'
  if (monthly < 150)  return 'Idle Earner'
  if (monthly < 400)  return 'Yield Curious'
  if (monthly < 1000) return 'Onchain Saver'
  if (monthly < 3000) return 'DeFi Native'
  return 'Whale Asleep'
}

function buildShareText(totalMonthly: number) {
  return `I could be earning $${totalMonthly.toFixed(2)}/mo on Base — and I wasn't.\n\nEarny showed me exactly where my assets should be working.\n\nCheck yours 👇\nearny.chat`
}

function calcOgUrl(totalMonthly: number) {
  const base = typeof window !== 'undefined' ? window.location.origin : 'https://earny.chat'
  const category = categoryFor(totalMonthly)
  return `${base}/api/og?monthly=${encodeURIComponent(totalMonthly.toFixed(2))}&category=${encodeURIComponent(category)}`
}

// ── Shared styles ─────────────────────────────────────────────────────────────
const primaryBtnStyle: React.CSSProperties = {
  font: "600 16px/1 var(--font-display)", background: BLUE, color: '#fff',
  border: 'none', padding: '16px 24px', borderRadius: 999, cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', gap: 10,
  boxShadow: '0 8px 24px rgba(25,109,253,0.3)',
}
const secondaryBtnStyle: React.CSSProperties = {
  font: "600 16px/1 var(--font-display)", background: '#fff', color: INK,
  border: `1px solid rgba(10,11,26,0.12)`, padding: '16px 24px', borderRadius: 999,
  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 10,
}
const shareBtnStyle: React.CSSProperties = {
  font: "600 14px/1 var(--font-display)", background: '#fff', color: INK,
  border: 'none', padding: '12px 18px', borderRadius: 999, cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', gap: 8,
}
const linkBtnStyle: React.CSSProperties = {
  font: "500 14px/1 var(--font-display)", background: BLUE_TINT, color: BLUE_DEEP,
  border: 'none', padding: '10px 16px', borderRadius: 999, cursor: 'pointer',
}

// ── Icons ─────────────────────────────────────────────────────────────────────
function WalletGlyph() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 10h18"/><circle cx="17" cy="15" r="1.2" fill="currentColor"/>
    </svg>
  )
}
function Arrow() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg> }
function ChevronRight() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6"/></svg> }
function ExternalArrow() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7M8 7h9v9"/></svg> }
function ShareIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg> }
function ChatIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> }
function InfoIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg> }
function TwitterIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> }
function FarcasterIcon() { return <svg width="14" height="14" viewBox="0 0 1000 1000" fill="currentColor"><path d="M257.778 155.556H742.222V844.444H671.111V528.889H670.414C662.554 441.677 589.258 373.333 500 373.333C410.742 373.333 337.446 441.677 329.586 528.889H328.889V844.444H257.778V155.556Z"/><path d="M128.889 253.333L157.778 351.111H182.222V746.667C169.949 746.667 160 756.616 160 768.889V795.556H155.556C143.283 795.556 133.333 805.505 133.333 817.778V844.444H382.222V817.778C382.222 805.505 372.273 795.556 360 795.556H355.556V768.889C355.556 756.616 345.606 746.667 333.333 746.667H306.667V253.333H128.889Z"/><path d="M675.556 746.667C663.283 746.667 653.333 756.616 653.333 768.889V795.556H648.889C636.616 795.556 626.667 805.505 626.667 817.778V844.444H875.556V817.778C875.556 805.505 865.606 795.556 853.333 795.556H848.889V768.889C848.889 756.616 838.94 746.667 826.667 746.667V351.111H851.111L880 253.333H702.222V746.667H675.556Z"/></svg> }
function CopyIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> }
function CheckIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg> }
function DownloadIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4v12M6 10l6 6 6-6M4 20h16"/></svg> }
function CalcIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="10" y2="10"/><line x1="14" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="10" y2="14"/><line x1="14" y1="14" x2="16" y2="14"/><line x1="8" y1="18" x2="10" y2="18"/><line x1="14" y1="18" x2="16" y2="18"/></svg> }

// ── Decorative ────────────────────────────────────────────────────────────────
function GridBackdrop() {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      backgroundImage: `radial-gradient(rgba(46,112,234,0.12) 1.2px, transparent 1.2px)`,
      backgroundSize: '28px 28px',
      maskImage: 'radial-gradient(ellipse 60% 50% at 50% 35%, #000 20%, transparent 80%)',
      WebkitMaskImage: 'radial-gradient(ellipse 60% 50% at 50% 35%, #000 20%, transparent 80%)',
      pointerEvents: 'none', zIndex: 1,
    }}/>
  )
}
function AuraBlob() {
  return (
    <div style={{
      position: 'absolute', top: '-20%', left: '50%', transform: 'translateX(-50%)',
      width: 1200, height: 700,
      background: `radial-gradient(ellipse at center, ${BLUE_2}33 0%, ${BLUE_DEEP}11 40%, transparent 70%)`,
      pointerEvents: 'none', zIndex: 0, filter: 'blur(40px)',
    }}/>
  )
}
function Pulse() {
  return <span style={{ width: 8, height: 8, background: '#fff', borderRadius: 999, animation: 'pulse 1s infinite', display: 'inline-block' }}/>
}
function AnimatedNumber({ value }: { value: number }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    const start = performance.now()
    const DUR = 900
    let raf: number
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / DUR)
      setN(value * (1 - Math.pow(1 - p, 3)))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value])
  return <span style={{ fontVariantNumeric: 'tabular-nums' }}>{n.toFixed(2)}</span>
}

function ProtoDisc({ p, size = 44 }: { p: Opportunity; size?: number }) {
  const [err, setErr] = useState(false)
  return (
    <div style={{
      width: size, height: size, borderRadius: 999, overflow: 'hidden',
      background: p.brand, color: '#fff', display: 'grid', placeItems: 'center',
      font: `700 ${Math.round(size * 0.36)}px/1 var(--font-display)`,
      letterSpacing: '-0.02em', boxShadow: 'inset 0 -2px 0 rgba(0,0,0,0.12)', flex: 'none',
    }}>
      {p.logo && !err
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={p.logo} alt={p.name} width={size} height={size} style={{ width: size, height: size, objectFit: 'cover', display: 'block' }} onError={() => setErr(true)}/>
        : p.initials}
    </div>
  )
}

function TrustMeter({ level }: { level: number }) {
  const colors = ['#E08A45', '#E6B93A', '#10B981']
  const labels = ['Low', 'Medium', 'High']
  const c = colors[Math.min(level - 1, 2)]
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end' }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{ width: 5, height: 6 + i * 4, borderRadius: 2, background: i <= level ? c : 'rgba(10,11,26,0.12)' }}/>
        ))}
      </div>
      <span style={{ font: "600 13px/1 var(--font-display)", color: c }}>{labels[Math.min(level - 1, 2)]}</span>
    </div>
  )
}

function AddrChip({ addr }: { addr: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px',
      background: '#fff', border: `1px solid rgba(10,11,26,0.08)`, borderRadius: 999,
      font: "500 14px/1 var(--font-display)",
    }}>
      <span style={{ width: 8, height: 8, background: GREEN, borderRadius: 999 }}/>
      {formatAddr(addr)}
    </div>
  )
}

function StatBlock({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div>
      <div style={{ font: "500 11px/1 var(--font-display)", color: INK_DIM, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
      <div style={{ font: "400 22px/1 var(--font-serif)", color: accent || INK }}>{value}</div>
    </div>
  )
}

function MiniPill({ dark = false }: { dark?: boolean }) {
  const bg     = dark ? 'rgba(255,255,255,0.06)' : CREAM
  const border = dark ? 'rgba(16,185,129,0.5)'   : GREEN
  const text   = dark ? 'rgba(255,255,255,0.9)'  : INK
  const link   = dark ? '#A3E9C9'                 : '#0B7A4E'
  return (
    <a href="https://clanker.world/clanker/0x534b7aAD1Cdb6F02eC48CAbe428f0D9131E40B07"
       target="_blank" rel="noopener noreferrer"
       style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '9px 18px', background: bg, border: `1.5px solid ${border}`, borderRadius: 999, font: "700 12px/1 var(--font-display)", letterSpacing: '0.1em', color: text, textDecoration: 'none', whiteSpace: 'nowrap' }}>
      <span style={{ width: 8, height: 8, background: GREEN, borderRadius: 999, boxShadow: `0 0 0 3px ${dark ? 'rgba(16,185,129,0.2)' : 'rgba(16,185,129,0.15)'}` }}/>
      <span><span style={{ color: link, textDecoration: 'underline', textUnderlineOffset: 2 }}>MINI</span> IS THE ONLY OFFICIAL TOKEN.</span>
    </a>
  )
}

function SiteFooter({ dark = true }: { dark?: boolean }) {
  const isMobile = useIsMobile()
  const fg       = dark ? 'rgba(255,255,255,0.55)' : INK_MUTED
  const fgStrong = dark ? 'rgba(255,255,255,0.9)'  : INK
  const border   = dark ? 'rgba(255,255,255,0.08)' : 'rgba(10,11,26,0.08)'
  const tokensLogo = dark ? '/tokens-logo.svg' : '/tokens-logo-dark.svg'
  return (
    <footer style={{ borderTop: `1px solid ${border}`, font: "400 13px/1.4 var(--font-display)", color: fg }}>
      {/* Tokens attribution — centered */}
      <div style={{ padding: isMobile ? '20px 20px 16px' : '28px 40px 20px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, borderBottom: `1px solid ${border}` }}>
        <span style={{ opacity: 0.6 }}>A product by</span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={tokensLogo} alt="Tokens" style={{ height: 18, display: 'block', opacity: 0.85 }}/>
      </div>
      <div style={{ padding: isMobile ? '16px 20px' : '20px 40px', display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>Built by</span>
          <a href="https://x.com/jenilt" target="_blank" rel="noopener noreferrer" style={{ color: fgStrong, textDecoration: 'none', fontWeight: 600 }}>@jenilt</a>
        </div>
        <div>earny.chat — read-only, never moves your funds.</div>
      </div>
    </footer>
  )
}

function HowStep({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div style={{ padding: 24, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18 }}>
      <div style={{ font: "500 12px/1 var(--font-display)", color: SKY, letterSpacing: '0.14em', marginBottom: 14 }}>{n}</div>
      <div style={{ font: "400 26px/1.15 var(--font-serif)", marginBottom: 8, letterSpacing: '-0.01em' }}>{title}</div>
      <div style={{ font: "400 14px/1.5 var(--font-display)", color: 'rgba(255,255,255,0.6)' }}>{body}</div>
    </div>
  )
}

// ── Landing ───────────────────────────────────────────────────────────────────
function Landing({ onAnalyze }: { onAnalyze: (addr: string) => void }) {
  const [addr, setAddr] = useState('')
  const isMobile = useIsMobile()
  const valid = /^0x[a-fA-F0-9]{40}$/.test(addr.trim())

  return (
    <div style={{ minHeight: '100vh', background: INK, color: '#fff', fontFamily: "var(--font-display)", display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      <GridBackdrop/>
      <AuraBlob/>

      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isMobile ? '20px 20px' : '26px 40px', position: 'relative', zIndex: 3 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/earny-logo.svg" alt="Earny" style={{ height: 28, display: 'block' }}/>
      </header>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '24px 20px 60px' : '32px 24px 80px', position: 'relative', zIndex: 2 }}>
        <MiniPill dark/>

        <h1 style={{ font: `400 clamp(38px, 6.5vw, 96px)/1.05 var(--font-serif)`, letterSpacing: '-0.02em', textAlign: 'center', margin: '24px 0 28px', maxWidth: 1100 }}>
          <span style={{ whiteSpace: isMobile ? 'normal' : 'nowrap' }}>You&apos;re leaving <em style={{ color: BLUE_2, fontStyle: 'italic', letterSpacing: '0.04em' }}>$ _____</em></span>
          <br/>
          <span style={{ whiteSpace: isMobile ? 'normal' : 'nowrap' }}>on the table every month.</span>
        </h1>

        <p style={{ font: "400 clamp(16px, 1.8vw, 22px)/1.45 var(--font-display)", color: 'rgba(255,255,255,0.68)', textAlign: 'center', maxWidth: 580, margin: '0 0 36px', padding: '0 8px' }}>
          Earny is your onchain CFO. Paste your wallet and see exactly how much you can earn monthly.
        </p>

        <form
          onSubmit={(e) => { e.preventDefault(); if (valid) onAnalyze(addr.trim()) }}
          style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 10 : 8, padding: isMobile ? 12 : 8, background: '#fff', borderRadius: isMobile ? 20 : 999, boxShadow: '0 30px 80px rgba(25,109,253,0.22), 0 2px 0 rgba(255,255,255,0.4) inset', width: 'min(640px, 92vw)' }}
        >
          {!isMobile && <div style={{ display: 'flex', alignItems: 'center', paddingLeft: 20, color: INK_MUTED }}><WalletGlyph/></div>}
          <input
            value={addr}
            onChange={(e) => setAddr(e.target.value)}
            placeholder={isMobile ? "0x wallet address…" : "paste a wallet address (0x…)"}
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', font: `500 ${isMobile ? 16 : 18}px/1 var(--font-display)`, color: INK, padding: isMobile ? '8px 12px' : '0 4px', minWidth: 0 }}
          />
          <button
            type="submit"
            disabled={!valid}
            style={{ border: 'none', cursor: valid ? 'pointer' : 'not-allowed', background: valid ? BLUE : '#CFD7E5', color: '#fff', font: "600 16px/1 var(--font-display)", padding: isMobile ? '16px' : '0 28px', borderRadius: isMobile ? 12 : 999, height: isMobile ? 52 : 52, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'transform .15s, background .15s' }}
          >
            Check mine <Arrow/>
          </button>
        </form>

        <button
          onClick={() => onAnalyze('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045')}
          style={{ marginTop: 16, background: 'transparent', color: 'rgba(255,255,255,0.55)', border: 'none', font: "500 14px/1 var(--font-display)", cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 4 }}
        >
          or try a sample wallet →
        </button>

        <div id="how" style={{ marginTop: isMobile ? 60 : 100, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 12, maxWidth: 980, width: '100%' }}>
          <HowStep n="01" title="Paste your wallet"       body="No signing, no connecting. Earny reads public onchain balances on Base."/>
          <HowStep n="02" title="See what you're missing" body="Every idle asset gets matched with live APYs from the top Base protocols."/>
          <HowStep n="03" title="Start earning"           body="One-tap links to each protocol. You sign every transaction yourself."/>
        </div>
      </main>

      <SiteFooter dark/>
    </div>
  )
}

// ── Analyzing ─────────────────────────────────────────────────────────────────
const ANALYZE_STEPS = [
  'Reading wallet balances on Base',
  'Fetching live protocol APYs',
  'Matching assets to opportunities',
  'Calculating monthly yield',
  'Building your report',
]

function Analyzing({ addr, onDone, onError }: { addr: string; onDone: (r: AnalyzeResult) => void; onError: (msg: string) => void }) {
  const [step, setStep] = useState(0)
  const [result, setResult] = useState<AnalyzeResult | null>(null)
  const calledDone = useRef(false)

  useEffect(() => {
    if (step >= ANALYZE_STEPS.length) return
    const t = setTimeout(() => setStep(s => s + 1), 700)
    return () => clearTimeout(t)
  }, [step])

  useEffect(() => {
    if (step >= ANALYZE_STEPS.length && result && !calledDone.current) {
      calledDone.current = true
      setTimeout(() => onDone(result), 300)
    }
  }, [step, result, onDone])

  useEffect(() => {
    const ctrl = new AbortController()
    fetch(`/api/analyze?address=${encodeURIComponent(addr)}`, { signal: ctrl.signal })
      .then(r => {
        if (!r.ok) return r.json().then(e => Promise.reject(new Error(e.error || 'Analysis failed')))
        return r.json() as Promise<AnalyzeResult>
      })
      .then(data => { if (!ctrl.signal.aborted) setResult(data) })
      .catch(err => { if (!ctrl.signal.aborted) onError(err.message) })
    return () => ctrl.abort()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addr])

  return (
    <div style={{ minHeight: '100vh', background: INK, color: '#fff', fontFamily: "var(--font-display)", display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, position: 'relative', overflow: 'hidden' }}>
      <GridBackdrop/>
      <AuraBlob/>
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 36 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 999, background: `conic-gradient(${BLUE_2}, transparent)`, animation: 'spin 1.2s linear infinite' }}/>
          <span style={{ font: "500 20px/1 var(--font-display)", color: 'rgba(255,255,255,0.8)' }}>
            Analysing {formatAddr(addr)}
          </span>
        </div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 14, minWidth: 300 }}>
          {ANALYZE_STEPS.map((s, i) => (
            <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, font: "500 17px/1.3 var(--font-display)", color: i < step ? '#fff' : 'rgba(255,255,255,0.35)', transition: 'color .3s' }}>
              <span style={{ width: 22, height: 22, borderRadius: 999, flex: 'none', display: 'grid', placeItems: 'center', background: i < step ? BLUE_2 : 'rgba(255,255,255,0.08)', color: '#fff', font: "700 12px/1 var(--font-display)", transition: 'background .3s' }}>
                {i < step ? '✓' : i === step ? <Pulse/> : ''}
              </span>
              {s}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

// ── Proto card ────────────────────────────────────────────────────────────────
function ProtoCard({ p, rank, onOpen }: { p: Opportunity; rank: number; onOpen: () => void }) {
  const [hover, setHover] = useState(false)
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <button
        onClick={onOpen}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{ display: 'grid', gridTemplateColumns: '44px 1fr auto', gap: '10px 14px', alignItems: 'center', padding: '16px', background: '#fff', borderRadius: 16, border: `1px solid ${hover ? BLUE : 'rgba(10,11,26,0.06)'}`, textAlign: 'left', color: 'inherit', transition: 'border-color .15s', cursor: 'pointer', width: '100%' }}
      >
        <ProtoDisc p={p} size={44}/>
        <div style={{ minWidth: 0 }}>
          <div style={{ font: "700 16px/1.1 var(--font-display)", marginBottom: 3 }}>{p.name}</div>
          <div style={{ font: "400 13px/1.4 var(--font-display)", color: INK_MUTED, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.asset} · {p.yieldPct}% APY</div>
        </div>
        <div style={{ textAlign: 'right', flex: 'none' }}>
          <div style={{ font: "400 22px/1 var(--font-serif)", color: BLUE }}>+${p.monthly.toFixed(2)}</div>
          <div style={{ font: "500 11px/1 var(--font-display)", color: INK_DIM, marginTop: 3 }}>/month</div>
        </div>
      </button>
    )
  }

  return (
    <button
      onClick={onOpen}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ display: 'grid', gridTemplateColumns: '36px 56px 1.5fr 110px 140px 150px 24px', gap: 20, alignItems: 'center', padding: '18px 24px', background: '#fff', borderRadius: 16, border: `1px solid ${hover ? BLUE : 'rgba(10,11,26,0.06)'}`, textAlign: 'left', color: 'inherit', transition: 'border-color .15s, transform .15s, box-shadow .15s', transform: hover ? 'translateX(4px)' : 'none', boxShadow: hover ? '0 8px 24px rgba(25,109,253,0.08)' : 'none', cursor: 'pointer', width: '100%' }}
    >
      <div style={{ font: "500 14px/1 var(--font-display)", color: INK_DIM }}>#{String(rank).padStart(2, '0')}</div>
      <ProtoDisc p={p} size={44}/>
      <div>
        <div style={{ font: "700 18px/1.1 var(--font-display)", marginBottom: 4 }}>{p.name}</div>
        <div style={{ font: "400 14px/1.4 var(--font-display)", color: INK_MUTED }}>{p.action}</div>
      </div>
      <div>
        <div style={{ font: "500 11px/1 var(--font-display)", color: INK_DIM, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>APY</div>
        <div style={{ font: "400 22px/1 var(--font-serif)", color: INK }}>{p.yieldPct}%</div>
      </div>
      <div>
        <div style={{ font: "500 11px/1 var(--font-display)", color: INK_DIM, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>Trust</div>
        <TrustMeter level={p.trust}/>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ font: "500 11px/1 var(--font-display)", color: INK_DIM, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>Each month</div>
        <div style={{ font: "400 28px/1 var(--font-serif)", color: BLUE }}>+${p.monthly.toFixed(2)}</div>
      </div>
      <div style={{ color: hover ? BLUE : INK_DIM, transition: 'color .15s' }}><ChevronRight/></div>
    </button>
  )
}

// ── Calculator ────────────────────────────────────────────────────────────────
function Calculator({ allRates }: { allRates: Rate[] }) {
  const [raw, setRaw] = useState('')
  const isMobile = useIsMobile()
  const amount = parseFloat(raw.replace(/,/g, '')) || 0
  // allRates already sorted by APY desc, already deduped by name

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'rgba(255,255,255,0.05)', border: `1.5px solid ${amount > 0 ? BLUE_2 : 'rgba(255,255,255,0.1)'}`, borderRadius: 16, padding: '4px 4px 4px 20px', maxWidth: 360, transition: 'border-color .2s' }}>
        <span style={{ font: "500 22px/1 var(--font-display)", color: 'rgba(255,255,255,0.4)' }}>$</span>
        <input
          type="text"
          inputMode="numeric"
          value={raw}
          onChange={(e) => setRaw(e.target.value.replace(/[^0-9,]/g, ''))}
          placeholder="10,000"
          autoFocus
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', font: "600 26px/1 var(--font-display)", color: '#fff', padding: '14px 4px', minWidth: 0 }}
        />
        {raw && (
          <button onClick={() => setRaw('')} style={{ flex: 'none', width: 36, height: 36, borderRadius: 12, background: 'rgba(255,255,255,0.1)', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', font: "600 16px/1 var(--font-display)", display: 'grid', placeItems: 'center' }}>✕</button>
        )}
      </div>

      {amount > 0 ? (
        <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {allRates.map(r => {
            const monthly = (amount * r.apy) / 100 / 12
            const disc: Opportunity = { id: r.id, name: r.name, tagline: '', logo: r.logo, brand: r.brand, initials: r.initials, asset: r.asset, size: '', action: '', detail: '', yieldPct: r.apy, monthly, trust: 1, steps: [], link: '' }
            return (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: isMobile ? '14px 16px' : '14px 18px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14 }}>
                <ProtoDisc p={disc} size={36}/>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ font: "600 15px/1 var(--font-display)", color: '#fff' }}>{r.name}</span>
                  <span style={{ font: "500 13px/1 var(--font-display)", color: 'rgba(255,255,255,0.35)' }}>{r.apy}% APY</span>
                </div>
                <div style={{ textAlign: 'right', flex: 'none' }}>
                  <div style={{ font: "400 22px/1 var(--font-serif)", color: BLUE_2 }}>+${monthly.toFixed(2)}</div>
                  <div style={{ font: "500 11px/1 var(--font-display)", color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>per month</div>
                </div>
              </div>
            )
          })}
          <div style={{ marginTop: 4, padding: '16px 18px', background: `linear-gradient(135deg, ${BLUE}22, ${BLUE_2}11)`, border: `1px solid ${BLUE_2}44`, borderRadius: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ font: "500 12px/1 var(--font-display)", color: SKY, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>Best on ${Number(amount.toFixed(0)).toLocaleString()}</div>
              <div style={{ font: "400 13px/1 var(--font-display)", color: 'rgba(255,255,255,0.5)' }}>{allRates[0]?.apy}% APY · {allRates[0]?.name}</div>
            </div>
            <div style={{ font: "400 32px/1 var(--font-serif)", color: '#fff' }}>
              +${((amount * (allRates[0]?.apy ?? 0)) / 100 / 12).toFixed(2)}<span style={{ font: "400 16px/1 var(--font-serif)", color: 'rgba(255,255,255,0.5)' }}>/mo</span>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ marginTop: 20, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[1000, 5000, 10000, 50000].map(preset => (
            <button key={preset} onClick={() => setRaw(preset.toLocaleString())}
              style={{ padding: '10px 18px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 999, font: "600 14px/1 var(--font-display)", color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}>
              ${preset.toLocaleString()}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Results ───────────────────────────────────────────────────────────────────
function Results({ result, onShare, onReset, onOpenProto, onShowCalc }: {
  result: AnalyzeResult
  onShare: () => void
  onReset: () => void
  onOpenProto: (p: Opportunity) => void
  onShowCalc: () => void
}) {
  const { address, opportunities, totalMonthly } = result
  const isMobile = useIsMobile()

  return (
    <div style={{ minHeight: '100vh', background: CREAM, color: INK, fontFamily: "var(--font-display)" }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isMobile ? '16px 20px' : '24px 40px', borderBottom: `1px solid rgba(10,11,26,0.06)`, flexWrap: 'wrap', gap: 12 }}>
        <button onClick={onReset} style={{ display: 'flex', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/earny-logo-dark.svg" alt="Earny" style={{ height: 26, display: 'block' }}/>
        </button>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <AddrChip addr={address}/>
          <button onClick={onReset} style={linkBtnStyle}>New wallet</button>
        </div>
      </header>

      <section style={{ padding: isMobile ? '40px 20px 32px' : '64px 40px 40px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ font: "500 13px/1 var(--font-display)", color: BLUE, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 20 }}>
          Based on your Base wallet holdings
        </div>

        {opportunities.length === 0 ? (
          <div style={{ padding: '60px 0', textAlign: 'center' }}>
            <h1 style={{ font: "400 clamp(36px, 6vw, 56px)/1.1 var(--font-serif)", margin: '0 0 16px' }}>No opportunities found</h1>
            <p style={{ font: "400 18px/1.5 var(--font-display)", color: INK_MUTED, maxWidth: 480, margin: '0 auto' }}>
              This wallet has no USDC, USDbC, or ETH on Base — or balances are below $1. Try a different wallet, or bridge assets to Base first.
            </p>
          </div>
        ) : (
          <>
            {/* ── Hero number ── */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: isMobile ? 8 : 14, flexWrap: 'wrap' }}>
              <h1 style={{ font: `400 clamp(72px, 13vw, 160px)/1 var(--font-serif)`, letterSpacing: '-0.02em', margin: 0, color: INK, display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ font: 'inherit', color: INK_DIM, fontSize: '0.46em' }}>$</span>
                <AnimatedNumber value={totalMonthly}/>
              </h1>
              <span style={{ font: `400 clamp(28px, 4vw, 56px)/1 var(--font-serif)`, color: INK_MUTED, fontStyle: 'italic', letterSpacing: '-0.02em' }}>/mo</span>
            </div>

            <p style={{ font: "400 clamp(16px, 1.6vw, 20px)/1.5 var(--font-display)", color: INK_MUTED, marginTop: 20, maxWidth: 680 }}>
              That&apos;s what your assets <em style={{ fontFamily: "var(--font-serif)", fontStyle: 'italic', color: INK, fontSize: 22 }}>could</em> be earning each month based on live APYs — if you deploy each asset to its best protocol.
            </p>
            <div style={{ display: 'flex', gap: 12, marginTop: 32, flexWrap: 'wrap' }}>
              <button onClick={onShare} style={primaryBtnStyle}><ShareIcon/> Share my results</button>
              <button onClick={onShowCalc} style={secondaryBtnStyle}><CalcIcon/> What could I earn?</button>
            </div>
          </>
        )}
      </section>

      {opportunities.length > 0 && (
        <>
        <section style={{ padding: isMobile ? '0 16px 60px' : '0 40px 60px', maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ font: "400 clamp(28px, 3.2vw, 44px)/1.1 var(--font-serif)", letterSpacing: '-0.01em', margin: '0 0 8px' }}>Where the money is</h2>
          <div style={{ font: "500 14px/1 var(--font-display)", color: INK_DIM, marginBottom: 20 }}>
            {opportunities.length} live {opportunities.length === 1 ? 'opportunity' : 'opportunities'} · APYs refresh every 15 min
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {opportunities.map((p, i) => <ProtoCard key={p.id} p={p} rank={i + 1} onOpen={() => onOpenProto(p)}/>)}
          </div>

          <div style={{ marginTop: 32, padding: isMobile ? '20px' : '24px', background: PAPER, borderRadius: 20, border: `1px solid ${BLUE_SOFT}`, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <div style={{ flex: 'none', width: 40, height: 40, borderRadius: 999, background: BLUE_TINT, display: 'grid', placeItems: 'center', color: BLUE }}><InfoIcon/></div>
            <div>
              <div style={{ font: "600 15px/1.3 var(--font-display)", marginBottom: 4 }}>How we calculate this</div>
              <div style={{ font: "400 14px/1.5 var(--font-display)", color: INK_MUTED, maxWidth: 760 }}>
                We read your token balances directly from Base chain, then fetch live APYs from DefiLlama. Monthly = <code style={{ fontFamily: 'monospace', background: 'rgba(0,0,0,0.05)', padding: '1px 5px', borderRadius: 4 }}>balance × APY ÷ 12</code>. The total shown is what you&apos;d earn deploying each asset into its single best protocol — no double-counting.
              </div>
            </div>
          </div>
        </section>

        </>
      )}

      <SiteFooter dark={false}/>
    </div>
  )
}

// ── Proto detail modal ────────────────────────────────────────────────────────
function ProtoDetail({ p, onClose }: { p: Opportunity; onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,11,26,0.55)', backdropFilter: 'blur(10px)', zIndex: 90, display: 'grid', placeItems: 'center', padding: 24, animation: 'fadein .2s' }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(560px, 100%)', background: CREAM, borderRadius: 24, overflow: 'hidden', boxShadow: '0 40px 120px rgba(10,11,26,0.5)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ padding: '28px 28px 24px', background: `linear-gradient(180deg, ${p.brand}14, transparent)`, borderBottom: `1px solid rgba(10,11,26,0.06)` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
            <ProtoDisc p={p} size={48}/>
            <div>
              <div style={{ font: "700 22px/1.1 var(--font-display)" }}>{p.name}</div>
              <div style={{ font: "400 14px/1.2 var(--font-display)", color: INK_MUTED, marginTop: 4 }}>{p.tagline}</div>
            </div>
            <button onClick={onClose} style={{ marginLeft: 'auto', width: 36, height: 36, borderRadius: 999, background: 'rgba(10,11,26,0.06)', border: 'none', cursor: 'pointer', display: 'grid', placeItems: 'center', color: INK_MUTED }}>✕</button>
          </div>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <StatBlock label="APY"        value={`${p.yieldPct}%`}/>
            <StatBlock label="Each month" value={`+$${p.monthly.toFixed(2)}`} accent={BLUE}/>
            <StatBlock label="Your size"  value={p.size}/>
            <div>
              <div style={{ font: "500 11px/1 var(--font-display)", color: INK_DIM, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>Trust</div>
              <TrustMeter level={p.trust}/>
            </div>
          </div>
        </div>
        <div style={{ padding: '24px 28px 28px' }}>
          <div style={{ font: "400 16px/1.5 var(--font-display)", color: INK_MUTED, marginBottom: 22 }}>{p.detail}</div>
          <div style={{ font: "500 12px/1 var(--font-display)", color: INK_DIM, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>How to earn</div>
          <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {p.steps.map((s, i) => (
              <li key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', font: "400 15px/1.45 var(--font-display)", color: INK }}>
                <span style={{ flex: 'none', width: 22, height: 22, borderRadius: 999, background: INK, color: '#fff', display: 'grid', placeItems: 'center', font: "600 12px/1 var(--font-display)", marginTop: 1 }}>{i + 1}</span>
                {s}
              </li>
            ))}
          </ol>
          <a href={p.link} target="_blank" rel="noopener noreferrer"
             style={{ ...primaryBtnStyle, marginTop: 24, width: '100%', justifyContent: 'center', textDecoration: 'none', padding: '18px 24px' }}>
            Open {p.name} <ExternalArrow/>
          </a>
          <div style={{ marginTop: 12, textAlign: 'center', font: "400 12px/1.4 var(--font-display)", color: INK_DIM }}>
            Earny never moves your funds. You sign every transaction yourself.
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Share card ────────────────────────────────────────────────────────────────
function ShareCard({ result }: { result: AnalyzeResult }) {
  const [scale, setScale] = useState(1)
  const cat = categoryFor(result.totalMonthly)
  const total = Math.round(result.totalMonthly)

  useEffect(() => {
    const compute = () => { const maxW = Math.min(1220, window.innerWidth - 48); setScale(Math.min(1, maxW / 1200)) }
    compute()
    window.addEventListener('resize', compute)
    return () => window.removeEventListener('resize', compute)
  }, [])

  return (
    <div style={{ width: 1200 * scale, height: 630 * scale, overflow: 'hidden', borderRadius: 20, boxShadow: '0 40px 120px rgba(0,0,0,0.6)' }}>
      <div style={{ width: 1200, height: 630, transform: `scale(${scale})`, transformOrigin: 'top left', background: INK, color: '#fff', padding: 64, fontFamily: "var(--font-display)", position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `radial-gradient(rgba(46,112,234,0.18) 1.5px, transparent 1.5px)`, backgroundSize: '36px 36px', maskImage: 'radial-gradient(ellipse 80% 60% at 80% 30%, #000 30%, transparent 70%)', WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 80% 30%, #000 30%, transparent 70%)', pointerEvents: 'none' }}/>
        <div style={{ position: 'absolute', top: -120, right: -120, width: 520, height: 520, background: `radial-gradient(circle, ${BLUE_2}66 0%, transparent 70%)`, borderRadius: 999, pointerEvents: 'none' }}/>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 2 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/earny-logo.svg" alt="Earny" style={{ height: 40 }}/>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '10px 18px', background: 'rgba(255,255,255,0.06)', border: `1px solid rgba(255,255,255,0.18)`, borderRadius: 999, font: "600 13px/1 var(--font-display)", letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.85)' }}>
            <span style={{ width: 6, height: 6, background: GREEN, borderRadius: 999 }}/>Your onchain CFO
          </div>
        </div>

        <div style={{ marginTop: 28, position: 'relative', zIndex: 2, maxWidth: 1000 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '8px 18px', background: `linear-gradient(90deg, ${BLUE}33, ${BLUE_2}00)`, border: `1px solid ${BLUE_2}55`, borderRadius: 999, font: "700 14px/1 var(--font-display)", letterSpacing: '0.14em', textTransform: 'uppercase', color: SKY, marginBottom: 16 }}>
            <span style={{ width: 6, height: 6, background: GREEN, borderRadius: 999 }}/>{cat.toUpperCase()}
          </div>
          <div style={{ font: "400 24px/1 var(--font-serif)", color: 'rgba(255,255,255,0.55)', marginBottom: 10, fontStyle: 'italic' }}>I&apos;m leaving</div>
          <div style={{ font: "400 190px/0.95 var(--font-serif)", letterSpacing: '-0.02em', display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ font: "400 100px/1 var(--font-serif)", opacity: 0.65 }}>$</span>
            <span>{total.toLocaleString()}</span>
            <span style={{ font: "400 64px/1 var(--font-serif)", color: 'rgba(255,255,255,0.55)', fontStyle: 'italic' }}>/mo</span>
          </div>
          <div style={{ font: "400 26px/1.25 var(--font-serif)", color: 'rgba(255,255,255,0.8)', marginTop: 14, fontStyle: 'italic', maxWidth: 820 }}>on the table. Earny showed me where.</div>
        </div>

        <div style={{ position: 'absolute', bottom: 48, left: 64, right: 64, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', zIndex: 2 }}>
          <div style={{ font: "400 20px/1.3 var(--font-serif)", color: 'rgba(255,255,255,0.7)', fontStyle: 'italic', maxWidth: 420 }}>earny.chat — read-only, never moves your funds.</div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ font: "500 12px/1 var(--font-display)", color: 'rgba(255,255,255,0.5)', marginBottom: 8, letterSpacing: '0.18em', textTransform: 'uppercase' }}>Check yours →</div>
            <div style={{ font: "600 28px/1 var(--font-display)", color: '#fff' }}>earny.chat</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Calc modal ────────────────────────────────────────────────────────────────
function CalcModal({ allRates, onClose }: { allRates: Rate[]; onClose: () => void }) {
  const isMobile = useIsMobile()
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(10,11,26,0.7)', backdropFilter: 'blur(10px)', zIndex: 100, display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', animation: 'fadein .2s', padding: isMobile ? 0 : 40 }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 820, background: INK, borderRadius: isMobile ? '24px 24px 0 0' : 24, overflow: 'hidden', maxHeight: isMobile ? '90vh' : '80vh', overflowY: 'auto', boxShadow: '0 -20px 80px rgba(0,0,0,0.5)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isMobile ? '20px 20px 0' : '28px 32px 0' }}>
          <div>
            <div style={{ font: "500 12px/1 var(--font-display)", color: SKY, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 8 }}>Run the numbers</div>
            <div style={{ font: "400 clamp(22px, 3vw, 30px)/1.1 var(--font-serif)", color: '#fff' }}>What could you earn?</div>
          </div>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'grid', placeItems: 'center', font: "600 16px/1 var(--font-display)", flex: 'none' }}>✕</button>
        </div>
        <div style={{ padding: isMobile ? '16px 20px 32px' : '20px 32px 36px' }}>
          <p style={{ font: "400 14px/1.5 var(--font-display)", color: 'rgba(255,255,255,0.5)', margin: '0 0 24px' }}>
            Enter any amount to see monthly returns at today&apos;s live APYs across each protocol.
          </p>
          <Calculator allRates={allRates}/>
        </div>
      </div>
    </div>
  )
}

// ── Share overlay ─────────────────────────────────────────────────────────────
function ShareOverlay({ result, onClose }: { result: AnalyzeResult; onClose: () => void }) {
  const [copied, setCopied] = useState(false)
  const isMobile = useIsMobile()
  const text     = buildShareText(result.totalMonthly)
  const ogUrl    = calcOgUrl(result.totalMonthly)

  const shareTwitter = useCallback(() => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`
    window.open(url, '_blank', 'noopener,noreferrer,width=600,height=400')
  }, [text])

  const shareFarcaster = useCallback(() => {
    const url = `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}`
    window.open(url, '_blank', 'noopener,noreferrer,width=600,height=500')
  }, [text])

  const copyLink = useCallback(() => {
    navigator.clipboard.writeText('https://earny.chat').then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [])

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(10,11,26,0.85)', backdropFilter: 'blur(12px)', zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: isMobile ? 16 : 40, animation: 'fadein .2s', overflow: 'auto' }}
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%', maxWidth: 1220 }}>

        {/* Share card preview — always shown, scaled on mobile */}
        <ShareCard result={result}/>

        {/* Action panel */}
        <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: isMobile ? '20px 16px' : '24px 28px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <div>
              <div style={{ font: "600 16px/1.2 var(--font-display)", color: '#fff', marginBottom: 4 }}>Share your results</div>
              <div style={{ font: "400 13px/1.5 var(--font-display)", color: 'rgba(255,255,255,0.5)' }}>
                Download the image, then attach it to your post for max impact.
              </div>
            </div>
            <button onClick={onClose} style={{ flex: 'none', width: 32, height: 32, borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>✕</button>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {/* Download — primary CTA */}
            <a
              href={ogUrl}
              download="earny-share.png"
              target="_blank"
              rel="noopener noreferrer"
              style={{ ...shareBtnStyle, background: BLUE, color: '#fff', flex: isMobile ? '1 1 45%' : 'none', justifyContent: 'center', padding: '14px 18px', textDecoration: 'none', boxShadow: '0 4px 16px rgba(25,109,253,0.3)' }}
            >
              <DownloadIcon/> Save image
            </a>
            <button
              onClick={shareTwitter}
              style={{ ...shareBtnStyle, background: '#000', color: '#fff', flex: isMobile ? '1 1 45%' : 'none', justifyContent: 'center', padding: '14px 18px' }}
            >
              <TwitterIcon/> Post to X
            </button>
            <button
              onClick={shareFarcaster}
              style={{ ...shareBtnStyle, background: '#7C3AED', color: '#fff', flex: isMobile ? '1 1 45%' : 'none', justifyContent: 'center', padding: '14px 18px' }}
            >
              <FarcasterIcon/> Farcaster
            </button>
            <button
              onClick={copyLink}
              style={{ ...shareBtnStyle, background: copied ? '#10B981' : 'rgba(255,255,255,0.1)', color: '#fff', flex: isMobile ? '1 1 45%' : 'none', justifyContent: 'center', padding: '14px 18px', transition: 'background .2s' }}
            >
              {copied ? <><CheckIcon/> Copied!</> : <><CopyIcon/> Copy link</>}
            </button>
          </div>

          <div style={{ marginTop: 14, font: "400 12px/1.4 var(--font-display)", color: 'rgba(255,255,255,0.3)' }}>
            Tip: save the image above, then attach it when posting to X or Farcaster for the card to show up in feeds.
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Error state ───────────────────────────────────────────────────────────────
function ErrorState({ message, onReset }: { message: string; onReset: () => void }) {
  return (
    <div style={{ minHeight: '100vh', background: INK, color: '#fff', fontFamily: "var(--font-display)", display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, padding: 40 }}>
      <div style={{ font: "400 clamp(32px, 6vw, 48px)/1 var(--font-serif)" }}>Something went wrong</div>
      <div style={{ font: "400 18px/1.5 var(--font-display)", color: 'rgba(255,255,255,0.6)', maxWidth: 480, textAlign: 'center' }}>{message}</div>
      <button onClick={onReset} style={{ ...primaryBtnStyle, marginTop: 8 }}>Try again</button>
    </div>
  )
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function Page() {
  const [view, setView]           = useState<'landing' | 'analyzing' | 'results' | 'error'>('landing')
  const [addr, setAddr]           = useState('')
  const [result, setResult]       = useState<AnalyzeResult | null>(null)
  const [errorMsg, setErrorMsg]   = useState('')
  const [showShare, setShowShare] = useState(false)
  const [showCalc, setShowCalc]   = useState(false)
  const [proto, setProto]         = useState<Opportunity | null>(null)

  const reset = () => { setView('landing'); setAddr(''); setResult(null); setErrorMsg('') }

  return (
    <>
      {view === 'landing'   && <Landing onAnalyze={(a) => { setAddr(a); setView('analyzing') }}/>}
      {view === 'analyzing' && (
        <Analyzing
          addr={addr}
          onDone={(r) => { setResult(r); setView('results') }}
          onError={(msg) => { setErrorMsg(msg); setView('error') }}
        />
      )}
      {view === 'results' && result && (
        <Results
          result={result}
          onShare={() => setShowShare(true)}
          onReset={reset}
          onOpenProto={(p) => setProto(p)}
          onShowCalc={() => setShowCalc(true)}
        />
      )}
      {view === 'error' && <ErrorState message={errorMsg} onReset={reset}/>}

      {showShare && result && <ShareOverlay result={result} onClose={() => setShowShare(false)}/>}
      {showCalc  && result && <CalcModal allRates={result.allRates} onClose={() => setShowCalc(false)}/>}
      {proto && <ProtoDetail p={proto} onClose={() => setProto(null)}/>}
    </>
  )
}
