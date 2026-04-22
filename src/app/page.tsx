'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import type { Opportunity, AnalyzeResult, CategoryId, RiskLevel } from '@/types'
import {
  CATEGORIES, RISK_STYLE, TOOLS_BY_CATEGORY,
  AUDIENCE_TIERS, LAUNCH_TYPES, estimateLaunch,
  FOUNDER_CATEGORIES, FOUNDER_STAGES, FOUNDER_FUNDING, estimateFounder,
  AIRDROP_TIERS, estimateAirdrop,
  type ToolDef,
} from '@/lib/categories'

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
  if (!a) return '–'
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
  return `I could be earning $${totalMonthly.toFixed(2)}/mo on Base, and I wasn't.\n\nEarny showed me exactly where my assets should be working.\n\nCheck yours 👇\nearny.chat`
}

// ── Shared styles ─────────────────────────────────────────────────────────────
const primaryBtnStyle: React.CSSProperties = {
  font: "600 16px/1 var(--font-display)", background: BLUE, color: '#fff',
  border: 'none', padding: '16px 24px', borderRadius: 999, cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', gap: 10,
  boxShadow: '0 8px 24px rgba(25,109,253,0.3)',
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
      {/* Tokens attribution, centered */}
      <div style={{ padding: isMobile ? '20px 20px 16px' : '28px 40px 20px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, borderBottom: `1px solid ${border}` }}>
        <span style={{ opacity: 0.6 }}>A product by</span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={tokensLogo} alt="Tokens" style={{ height: 18, display: 'block', opacity: 0.85 }}/>
      </div>
      <div style={{ padding: isMobile ? '16px 20px' : '20px 40px', display: 'flex', flexDirection: isMobile ? 'column' : 'row', flexWrap: 'wrap', gap: isMobile ? 8 : 16, justifyContent: isMobile ? 'center' : 'space-between', alignItems: 'center', textAlign: isMobile ? 'center' : 'left' }}>
        <div>
          Built by{' '}
          <a href="https://x.com/jenilt" target="_blank" rel="noopener noreferrer" style={{ color: fgStrong, textDecoration: 'none', fontWeight: 600 }}>@jenilt</a>
        </div>
        <div>earny.chat · read-only, never moves your funds.</div>
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

      <header style={{ display: 'flex', alignItems: 'center', justifyContent: isMobile ? 'center' : 'space-between', padding: isMobile ? '20px 20px' : '26px 40px', position: 'relative', zIndex: 3 }}>
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
          Drop your wallet and see every way to earn on Base, matched to your assets in seconds.
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
          <HowStep n="03" title="Start earning"           body="One-tap links to each earning opportunity."/>
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
          <div style={{ font: "400 13px/1.4 var(--font-display)", color: INK_MUTED, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.asset} · {p.variable ? 'Variable' : `${p.yieldPct}% APY`}</div>
        </div>
        <div style={{ textAlign: 'right', flex: 'none' }}>
          <div style={{ font: "400 22px/1 var(--font-serif)", color: BLUE }}>{p.variable ? 'Variable' : `+$${p.monthly.toFixed(2)}`}</div>
          <div style={{ font: "500 11px/1 var(--font-display)", color: INK_DIM, marginTop: 3 }}>{p.variable ? 'reward' : '/month'}</div>
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
        <div style={{ font: "400 22px/1 var(--font-serif)", color: INK }}>{p.variable ? 'Variable' : `${p.yieldPct}%`}</div>
      </div>
      <div>
        <div style={{ font: "500 11px/1 var(--font-display)", color: INK_DIM, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>Trust</div>
        <TrustMeter level={p.trust}/>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ font: "500 11px/1 var(--font-display)", color: INK_DIM, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>Each month</div>
        <div style={{ font: "400 28px/1 var(--font-serif)", color: BLUE }}>{p.variable ? 'Variable' : `+$${p.monthly.toFixed(2)}`}</div>
      </div>
      <div style={{ color: hover ? BLUE : INK_DIM, transition: 'color .15s' }}><ChevronRight/></div>
    </button>
  )
}

// ── Goal panel (inline, shown near hero) ─────────────────────────────────────
function GoalPanel({
  yieldMonthly, extras, isMobile,
}: {
  yieldMonthly: number
  extras: Record<Exclude<CategoryId, 'yield'>, { enabled: boolean; monthly: number }>
  isMobile: boolean
}) {
  const [goal, setGoal] = useState('')
  const goalNum = parseFloat(goal) || 0
  const plan = useMemo(() => {
    if (goalNum <= 0) return null
    const have = yieldMonthly
      + (extras.launch.enabled ? extras.launch.monthly : 0)
      + (extras.founder.enabled ? extras.founder.monthly : 0)
      + (extras.airdrop.enabled ? extras.airdrop.monthly : 0)
    if (have >= goalNum) return { have, need: 0, suggest: [] as { name: string; monthly: number; risk: RiskLevel }[] }
    let need = goalNum - have
    const order = [
      { id: 'airdrop' as const, name: 'Airdrops',        risk: 'medium' as RiskLevel, monthly: AIRDROP_TIERS[AIRDROP_TIERS.length - 1].monthly },
      { id: 'launch'  as const, name: 'Token Launch',    risk: 'high'   as RiskLevel, monthly: AUDIENCE_TIERS[AUDIENCE_TIERS.length - 2].monthly * 2.2 },
      { id: 'founder' as const, name: 'Founder Revenue', risk: 'high'   as RiskLevel, monthly: FOUNDER_CATEGORIES.find(c => c.id === 'perps')!.monthly * 1.0 },
    ]
    const suggest: { name: string; monthly: number; risk: RiskLevel }[] = []
    for (const o of order) {
      if (need <= 0) break
      if (extras[o.id].enabled) continue
      const take = Math.min(o.monthly, need)
      suggest.push({ name: o.name, monthly: Math.round(take), risk: o.risk })
      need -= o.monthly
    }
    return { have, need: Math.max(0, Math.round(need)), suggest }
  }, [goalNum, yieldMonthly, extras])

  return (
    <div style={{ padding: isMobile ? '18px' : '22px 24px', background: INK, color: '#fff', borderRadius: 20, marginTop: 32 }}>
      <div style={{ font: "500 12px/1 var(--font-display)", color: SKY, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 10 }}>Goal calculator</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ font: "400 22px/1 var(--font-serif)", color: 'rgba(255,255,255,0.7)' }}>I want to make</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'rgba(255,255,255,0.08)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.12)' }}>
          <span style={{ font: "400 22px/1 var(--font-serif)", color: 'rgba(255,255,255,0.6)' }}>$</span>
          <input
            type="number" inputMode="decimal" placeholder="5000" value={goal}
            onChange={e => setGoal(e.target.value)}
            style={{ font: "400 22px/1 var(--font-serif)", color: '#fff', background: 'transparent', border: 'none', outline: 'none', width: 120 }}
          />
        </div>
        <span style={{ font: "400 22px/1 var(--font-serif)", color: 'rgba(255,255,255,0.7)' }}>/ month.</span>
      </div>
      {plan && (
        <div style={{ marginTop: 16, font: "400 14px/1.6 var(--font-display)", color: 'rgba(255,255,255,0.75)' }}>
          {plan.suggest.length === 0 ? (
            <span>You&apos;re already there on paper. Activate the categories below to lock in the plan.</span>
          ) : (
            <>
              <div>You have <strong style={{ color: '#fff' }}>${Math.round(plan.have).toLocaleString()}/mo</strong> covered. To hit <strong style={{ color: '#fff' }}>${goalNum.toLocaleString()}/mo</strong>, stack:</div>
              <ul style={{ margin: '10px 0 0', padding: 0, listStyle: 'none', display: 'grid', gap: 6 }}>
                {plan.suggest.map(s => (
                  <li key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ color: '#fff', fontWeight: 600 }}>+${s.monthly.toLocaleString()}</span>
                    <span>from {s.name}</span>
                    <RiskBadge risk={s.risk}/>
                  </li>
                ))}
                {plan.need > 0 && (
                  <li style={{ color: 'rgba(255,255,255,0.6)', fontStyle: 'italic' }}>
                    Still need ${plan.need.toLocaleString()}/mo beyond these. Scale your inputs below.
                  </li>
                )}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ── Source + risks block (shown per category) ────────────────────────────────
function SourceIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
  )
}
function WarnIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  )
}

function SourceAndRisks({ categoryId }: { categoryId: CategoryId }) {
  const meta = CATEGORIES.find(c => c.id === categoryId)!
  const isMobile = useIsMobile()
  return (
    <div style={{ marginTop: 28, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
      <div style={{ padding: '20px 22px', background: PAPER, borderRadius: 16, border: `1px solid rgba(10,11,26,0.08)` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, color: BLUE_DEEP }}>
          <SourceIcon/>
          <div style={{ font: "600 12px/1 var(--font-display)", letterSpacing: '0.14em', textTransform: 'uppercase' }}>Data sources</div>
        </div>
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 6 }}>
          {meta.sources.map((s, i) => (
            <li key={i} style={{ font: "400 13px/1.5 var(--font-display)", color: INK_MUTED }}>
              {s.url
                ? <a href={s.url} target="_blank" rel="noopener noreferrer" style={{ color: BLUE, textDecoration: 'underline' }}>{s.label}</a>
                : s.label}
            </li>
          ))}
        </ul>
      </div>

      <div style={{ padding: '20px 22px', background: 'rgba(245,158,11,0.08)', borderRadius: 16, border: `1px solid rgba(245,158,11,0.22)` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, color: '#B45309' }}>
          <WarnIcon/>
          <div style={{ font: "600 12px/1 var(--font-display)", letterSpacing: '0.14em', textTransform: 'uppercase' }}>Risks to bear in mind</div>
        </div>
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 8 }}>
          {meta.risks.map((r, i) => (
            <li key={i} style={{ display: 'flex', gap: 8, font: "400 13px/1.5 var(--font-display)", color: INK_MUTED }}>
              <span style={{ flex: 'none', color: '#B45309', marginTop: 2 }}>•</span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

// ── Category helpers ──────────────────────────────────────────────────────────
function RiskBadge({ risk }: { risk: RiskLevel }) {
  const s = RISK_STYLE[risk]
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: s.bg, color: s.fg, borderRadius: 999, font: "700 11px/1 var(--font-display)", letterSpacing: '0.12em' }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: s.fg }}/>{s.label}
    </span>
  )
}

function Segmented<T extends string>({ options, value, onChange }: { options: readonly { id: T; label: string }[]; value: T | ''; onChange: (v: T) => void }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {options.map(o => {
        const active = o.id === value
        return (
          <button key={o.id} onClick={() => onChange(o.id)} style={{
            font: "500 13px/1 var(--font-display)",
            padding: '10px 14px', borderRadius: 999,
            background: active ? INK : 'transparent',
            color: active ? '#fff' : INK,
            border: `1px solid ${active ? INK : 'rgba(10,11,26,0.15)'}`,
            cursor: 'pointer', transition: 'all .15s',
          }}>{o.label}</button>
        )
      })}
    </div>
  )
}

function ToolCard({ t, onOpen }: { t: ToolDef; onOpen: () => void }) {
  return (
    <button onClick={onOpen} style={{
      display: 'flex', alignItems: 'center', gap: 14, width: '100%', textAlign: 'left',
      padding: '14px 16px', background: '#fff', border: `1px solid ${t.primary ? BLUE_SOFT : 'rgba(10,11,26,0.1)'}`,
      borderRadius: 14, cursor: 'pointer',
    }}>
      <div style={{ flex: 'none', width: 40, height: 40, borderRadius: 10, background: t.brand, color: '#fff', display: 'grid', placeItems: 'center', overflow: 'hidden', font: "700 14px/1 var(--font-display)" }}>
        {t.logo
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={t.logo} alt={t.name} style={{ width: 40, height: 40, objectFit: 'contain' }}/>
          : t.initials}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ font: "700 15px/1.2 var(--font-display)", color: INK }}>{t.name}</div>
          {t.primary && <span style={{ font: "700 10px/1 var(--font-display)", letterSpacing: '0.14em', color: BLUE, background: BLUE_TINT, padding: '3px 7px', borderRadius: 999 }}>PICK</span>}
        </div>
        <div style={{ font: "400 13px/1.4 var(--font-display)", color: INK_MUTED, marginTop: 3 }}>{t.tagline}</div>
      </div>
      <span style={{ flex: 'none', color: INK_DIM, font: "500 18px/1 var(--font-display)" }}>→</span>
    </button>
  )
}

function ToolDetail({ t, onClose }: { t: ToolDef; onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,11,26,0.55)', backdropFilter: 'blur(10px)', zIndex: 90, display: 'grid', placeItems: 'center', padding: 24, animation: 'fadein .2s' }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(560px, 100%)', background: CREAM, borderRadius: 24, overflow: 'hidden', boxShadow: '0 40px 120px rgba(10,11,26,0.5)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ padding: '28px 28px 24px', background: `linear-gradient(180deg, ${t.brand}14, transparent)`, borderBottom: `1px solid rgba(10,11,26,0.06)` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
            <div style={{ flex: 'none', width: 48, height: 48, borderRadius: 12, background: t.brand, color: '#fff', display: 'grid', placeItems: 'center', overflow: 'hidden', font: "700 16px/1 var(--font-display)" }}>
              {t.logo
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={t.logo} alt={t.name} style={{ width: 48, height: 48, objectFit: 'contain' }}/>
                : t.initials}
            </div>
            <div>
              <div style={{ font: "700 22px/1.1 var(--font-display)" }}>{t.name}</div>
              <div style={{ font: "400 14px/1.2 var(--font-display)", color: INK_MUTED, marginTop: 4 }}>{t.tagline}</div>
            </div>
            <button onClick={onClose} style={{ marginLeft: 'auto', width: 36, height: 36, borderRadius: 999, background: 'rgba(10,11,26,0.06)', border: 'none', cursor: 'pointer', display: 'grid', placeItems: 'center', color: INK_MUTED }}>✕</button>
          </div>
        </div>
        <div style={{ padding: '24px 28px 28px' }}>
          <div style={{ font: "400 16px/1.5 var(--font-display)", color: INK_MUTED, marginBottom: 22 }}>{t.detail}</div>
          <div style={{ font: "500 12px/1 var(--font-display)", color: INK_DIM, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>How to start</div>
          <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {t.steps.map((s, i) => (
              <li key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', font: "400 15px/1.45 var(--font-display)", color: INK }}>
                <span style={{ flex: 'none', width: 22, height: 22, borderRadius: 999, background: INK, color: '#fff', display: 'grid', placeItems: 'center', font: "600 12px/1 var(--font-display)", marginTop: 1 }}>{i + 1}</span>
                {s}
              </li>
            ))}
          </ol>
          <a href={t.link} target="_blank" rel="noopener noreferrer"
             style={{ ...primaryBtnStyle, marginTop: 24, width: '100%', justifyContent: 'center', textDecoration: 'none', padding: '18px 24px' }}>
            Open {t.name} <ExternalArrow/>
          </a>
          <div style={{ marginTop: 12, textAlign: 'center', font: "400 12px/1.4 var(--font-display)", color: INK_DIM }}>
            Earny never moves your funds. You sign every transaction yourself.
          </div>
        </div>
      </div>
    </div>
  )
}

function CategoryPanel({
  title, estimate, onToggle, enabled, children, note, tools, onOpenTool,
}: {
  title: string
  estimate: number
  enabled: boolean
  onToggle: () => void
  children: React.ReactNode
  note?: string
  tools?: ToolDef[]
  onOpenTool?: (t: ToolDef) => void
}) {
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'grid', gap: 12 }}>{children}</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', padding: '16px 18px', background: BLUE_TINT, borderRadius: 14, border: `1px solid ${BLUE_SOFT}` }}>
        <div>
          <div style={{ font: "500 11px/1 var(--font-display)", color: INK_DIM, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 4 }}>{title} estimate</div>
          <div style={{ font: "400 32px/1 var(--font-serif)", color: INK }}>+${estimate.toLocaleString()}<span style={{ font: "400 16px/1 var(--font-serif)", color: INK_MUTED, fontStyle: 'italic' }}> /mo</span></div>
        </div>
        <button onClick={onToggle} disabled={estimate <= 0} style={{
          font: "600 14px/1 var(--font-display)", padding: '12px 18px', borderRadius: 999,
          background: enabled ? GREEN : BLUE,
          color: '#fff', border: 'none', cursor: estimate > 0 ? 'pointer' : 'not-allowed',
          opacity: estimate > 0 ? 1 : 0.4,
        }}>{enabled ? '✓ Added to total' : 'Add to my total'}</button>
      </div>

      {tools && tools.length > 0 && onOpenTool && (
        <div style={{ display: 'grid', gap: 10, marginTop: 4 }}>
          <div style={{ font: "500 11px/1 var(--font-display)", color: INK_DIM, letterSpacing: '0.14em', textTransform: 'uppercase' }}>How to actually do it</div>
          {tools.map(t => <ToolCard key={t.id} t={t} onOpen={() => onOpenTool(t)}/>)}
        </div>
      )}

      {note && <div style={{ font: "400 12px/1.5 var(--font-display)", color: INK_DIM }}>{note}</div>}
    </div>
  )
}

function CategoriesSection({
  opportunities, yieldMonthly, extras, setExtras, isMobile, onOpenProto,
}: {
  opportunities: Opportunity[]
  yieldMonthly: number
  extras: Record<Exclude<CategoryId, 'yield'>, { enabled: boolean; monthly: number }>
  setExtras: React.Dispatch<React.SetStateAction<Record<Exclude<CategoryId, 'yield'>, { enabled: boolean; monthly: number }>>>
  isMobile: boolean
  onOpenProto: (p: Opportunity) => void
}) {
  const [tab, setTab] = useState<CategoryId>('yield')
  const [openTool, setOpenTool] = useState<ToolDef | null>(null)

  // Launch inputs
  const [audience, setAudience]       = useState<(typeof AUDIENCE_TIERS)[number]['id'] | ''>('')
  const [launchType, setLaunchType]   = useState<(typeof LAUNCH_TYPES)[number]['id'] | ''>('')
  const [priorLaunch, setPriorLaunch] = useState(false)
  const launchEstimate = useMemo(
    () => audience && launchType ? estimateLaunch(audience, launchType, priorLaunch) : 0,
    [audience, launchType, priorLaunch]
  )
  useEffect(() => {
    setExtras(e => e.launch.monthly === launchEstimate ? e : { ...e, launch: { ...e.launch, monthly: launchEstimate } })
  }, [launchEstimate, setExtras])

  // Founder inputs
  const [founderCat, setFounderCat]     = useState<(typeof FOUNDER_CATEGORIES)[number]['id'] | ''>('')
  const [founderStage, setFounderStage] = useState<(typeof FOUNDER_STAGES)[number]['id'] | ''>('')
  const founderEstimate = useMemo(
    () => founderCat && founderStage ? estimateFounder(founderCat, founderStage) : 0,
    [founderCat, founderStage]
  )
  useEffect(() => {
    setExtras(e => e.founder.monthly === founderEstimate ? e : { ...e, founder: { ...e.founder, monthly: founderEstimate } })
  }, [founderEstimate, setExtras])

  // Airdrop inputs
  const [airdropTier, setAirdropTier] = useState<(typeof AIRDROP_TIERS)[number]['id'] | ''>('')
  const airdropEstimate = useMemo(
    () => airdropTier ? estimateAirdrop(airdropTier) : 0,
    [airdropTier]
  )
  useEffect(() => {
    setExtras(e => e.airdrop.monthly === airdropEstimate ? e : { ...e, airdrop: { ...e.airdrop, monthly: airdropEstimate } })
  }, [airdropEstimate, setExtras])

  const toggle = useCallback((k: Exclude<CategoryId, 'yield'>) => {
    setExtras(e => ({ ...e, [k]: { ...e[k], enabled: !e[k].enabled } }))
  }, [setExtras])

  // Founder funding stage — informational only, no estimate impact.
  const [founderFunding, setFounderFunding] = useState<(typeof FOUNDER_FUNDING)[number]['id'] | ''>('')

  const meta = CATEGORIES.find(c => c.id === tab)!

  return (
    <section style={{ padding: isMobile ? '0 16px 60px' : '0 40px 60px', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ font: "500 14px/1.4 var(--font-display)", color: INK_DIM, marginBottom: 14 }}>
        Explore every way to earn on Base. Pick a category to dive in.
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6, marginBottom: 18,
        WebkitOverflowScrolling: 'touch',
        position: 'sticky', top: 0, zIndex: 10,
        background: CREAM,
        margin: isMobile ? '0 -16px 18px' : '0 -40px 18px',
        padding: isMobile ? '8px 16px' : '12px 40px',
        borderBottom: '1px solid rgba(10,11,26,0.06)',
      }}>
        {(['yield', 'airdrop', 'launch', 'founder'] as const).map(id => {
          const c = CATEGORIES.find(x => x.id === id)!
          const active = tab === id
          const badge =
            id === 'yield'
              ? { show: yieldMonthly > 0, amount: yieldMonthly }
              : { show: extras[id].enabled, amount: extras[id].monthly }
          return (
            <button key={id} onClick={() => setTab(id)} style={{
              flex: 'none',
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 16px', borderRadius: 14,
              background: active ? INK : '#fff',
              color: active ? '#fff' : INK,
              border: `1px solid ${active ? INK : 'rgba(10,11,26,0.1)'}`,
              cursor: 'pointer', font: "600 14px/1 var(--font-display)",
              transition: 'background .15s, color .15s',
            }}>
              <span>{c.name}</span>
              <RiskBadge risk={c.risk}/>
              {badge.show && <span style={{ font: "500 12px/1 var(--font-display)", color: active ? SKY : GREEN }}>+${Math.round(badge.amount).toLocaleString()}</span>}
            </button>
          )
        })}
      </div>

      {/* Active tab panel */}
      <div style={{ padding: isMobile ? '20px' : '28px 32px', background: '#fff', borderRadius: 20, border: '1px solid rgba(10,11,26,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6, flexWrap: 'wrap' }}>
          <h3 style={{ font: "400 clamp(22px, 2.4vw, 28px)/1.1 var(--font-serif)", margin: 0 }}>{meta.name}</h3>
          <RiskBadge risk={meta.risk}/>
        </div>
        <p style={{ font: "400 14px/1.6 var(--font-display)", color: INK_MUTED, margin: '0 0 20px', maxWidth: 680 }}>{meta.blurb}</p>

        {tab === 'yield' && (
          <div style={{ display: 'grid', gap: 14 }}>
            <div style={{ font: "500 12px/1 var(--font-display)", color: INK_DIM, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
              {opportunities.length} {opportunities.length === 1 ? 'opportunity' : 'opportunities'} matched to your balances
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              {opportunities.map((p, i) => <ProtoCard key={p.id} p={p} rank={i + 1} onOpen={() => onOpenProto(p)}/>)}
            </div>
          </div>
        )}

        {tab === 'launch' && (
          <CategoryPanel
            title="Token launch"
            estimate={launchEstimate}
            enabled={extras.launch.enabled}
            onToggle={() => toggle('launch')}
            tools={TOOLS_BY_CATEGORY.launch}
            onOpenTool={setOpenTool}
          >
            <div>
              <div style={{ font: "500 11px/1 var(--font-display)", color: INK_DIM, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 8 }}>Your audience</div>
              <Segmented options={AUDIENCE_TIERS.map(t => ({ id: t.id, label: t.label }))} value={audience} onChange={setAudience}/>
            </div>
            <div>
              <div style={{ font: "500 11px/1 var(--font-display)", color: INK_DIM, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 8 }}>Token type</div>
              <Segmented options={LAUNCH_TYPES.map(t => ({ id: t.id, label: t.label }))} value={launchType} onChange={setLaunchType}/>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', font: "500 14px/1 var(--font-display)", color: INK }}>
              <input type="checkbox" checked={priorLaunch} onChange={e => setPriorLaunch(e.target.checked)} style={{ accentColor: BLUE, width: 16, height: 16 }}/>
              I&apos;ve launched a token before (1.4× boost)
            </label>
          </CategoryPanel>
        )}

        {tab === 'founder' && (
          <CategoryPanel
            title="Founder"
            estimate={founderEstimate}
            enabled={extras.founder.enabled}
            onToggle={() => toggle('founder')}
            tools={TOOLS_BY_CATEGORY.founder}
            onOpenTool={setOpenTool}
          >
            <div>
              <div style={{ font: "500 11px/1 var(--font-display)", color: INK_DIM, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 8 }}>What are you building?</div>
              <Segmented options={FOUNDER_CATEGORIES.map(c => ({ id: c.id, label: c.label }))} value={founderCat} onChange={setFounderCat}/>
            </div>
            <div>
              <div style={{ font: "500 11px/1 var(--font-display)", color: INK_DIM, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 8 }}>Stage</div>
              <Segmented options={FOUNDER_STAGES.map(s => ({ id: s.id, label: s.label }))} value={founderStage} onChange={setFounderStage}/>
            </div>
            <div>
              <div style={{ font: "500 11px/1 var(--font-display)", color: INK_DIM, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 8 }}>Funding (informational)</div>
              <Segmented options={FOUNDER_FUNDING.map(f => ({ id: f.id, label: f.label }))} value={founderFunding} onChange={setFounderFunding}/>
            </div>
          </CategoryPanel>
        )}

        {tab === 'airdrop' && (
          <CategoryPanel
            title="Airdrop"
            estimate={airdropEstimate}
            enabled={extras.airdrop.enabled}
            onToggle={() => toggle('airdrop')}
            tools={TOOLS_BY_CATEGORY.airdrop}
            onOpenTool={setOpenTool}
          >
            <div>
              <div style={{ font: "500 11px/1 var(--font-display)", color: INK_DIM, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 8 }}>How active are you?</div>
              <Segmented options={AIRDROP_TIERS.map(t => ({ id: t.id, label: t.label }))} value={airdropTier} onChange={setAirdropTier}/>
            </div>
          </CategoryPanel>
        )}

        <SourceAndRisks categoryId={tab}/>
      </div>

      {openTool && <ToolDetail t={openTool} onClose={() => setOpenTool(null)}/>}
    </section>
  )
}

// ── Results ───────────────────────────────────────────────────────────────────
function Results({ result, onShare, onReset, onOpenProto }: {
  result: AnalyzeResult
  onShare: () => void
  onReset: () => void
  onOpenProto: (p: Opportunity) => void
}) {
  const { address, opportunities, totalMonthly: yieldMonthly } = result
  const isMobile = useIsMobile()

  // Extras from other categories; each has enabled flag and computed monthly.
  const [extras, setExtras] = useState<Record<Exclude<CategoryId, 'yield'>, { enabled: boolean; monthly: number }>>({
    launch:   { enabled: false, monthly: 0 },
    founder:  { enabled: false, monthly: 0 },
    airdrop:  { enabled: false, monthly: 0 },
  })

  const extrasTotal = (['launch', 'founder', 'airdrop'] as const).reduce(
    (s, k) => s + (extras[k].enabled ? extras[k].monthly : 0), 0
  )
  const totalMonthly = yieldMonthly + extrasTotal

  return (
    <div style={{ minHeight: '100vh', background: CREAM, color: INK, fontFamily: "var(--font-display)" }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: isMobile ? 'center' : 'space-between', padding: isMobile ? '16px 20px' : '24px 40px', borderBottom: `1px solid rgba(10,11,26,0.06)`, flexWrap: 'wrap', gap: 12 }}>
        <button onClick={onReset} style={{ display: 'flex', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/earny-logo-dark.svg" alt="Earny" style={{ height: 26, display: 'block' }}/>
        </button>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
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
              This wallet has no USDC, USDbC, or ETH on Base, or balances are below $1. Try a different wallet, or bridge assets to Base first.
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
              {extrasTotal > 0 ? (
                <>Your combined potential across <strong style={{ color: INK }}>Yield</strong> (${Math.round(yieldMonthly).toLocaleString()}/mo) plus the categories you activated below (${Math.round(extrasTotal).toLocaleString()}/mo).</>
              ) : (
                <>That&apos;s what your assets <em style={{ fontFamily: "var(--font-serif)", fontStyle: 'italic', color: INK, fontSize: 22 }}>could</em> be earning each month based on live APYs, if you deploy each asset to its best protocol. Stack more categories below.</>
              )}
            </p>
            <div style={{ display: 'flex', gap: 12, marginTop: 32, flexWrap: 'wrap' }}>
              <button onClick={onShare} style={primaryBtnStyle}><ShareIcon/> Share my results</button>
            </div>

            <GoalPanel yieldMonthly={yieldMonthly} extras={extras} isMobile={isMobile}/>
          </>
        )}
      </section>

      {opportunities.length > 0 && (
        <>
        <CategoriesSection
          opportunities={opportunities}
          yieldMonthly={yieldMonthly}
          extras={extras}
          setExtras={setExtras}
          isMobile={isMobile}
          onOpenProto={onOpenProto}
        />

        <section style={{ padding: isMobile ? '0 16px 40px' : '0 40px 40px', maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ padding: isMobile ? '16px 18px' : '18px 22px', background: PAPER, borderRadius: 14, border: `1px solid rgba(10,11,26,0.08)`, font: "400 13px/1.55 var(--font-display)", color: INK_MUTED }}>
            <strong style={{ color: INK, fontWeight: 600 }}>For informational purposes only.</strong> Not financial, legal, or tax advice. APYs and earnings estimates are variable, sourced from third parties, and can change or be inaccurate at any time. Do your own research and consult a qualified professional before acting.
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
            <StatBlock label="APY"        value={p.variable ? 'Variable' : `${p.yieldPct}%`}/>
            <StatBlock label="Each month" value={p.variable ? 'Variable' : `+$${p.monthly.toFixed(2)}`} accent={BLUE}/>
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
function ShareCard({ result, captureRef }: { result: AnalyzeResult; captureRef?: React.RefObject<HTMLDivElement | null> }) {
  const [scale, setScale] = useState(1)
  const cat = categoryFor(result.totalMonthly)
  const total = Math.round(result.totalMonthly)

  useEffect(() => {
    const compute = () => { const maxW = Math.min(1220, window.innerWidth - 48); setScale(Math.min(1, maxW / 1200)) }
    compute()
    window.addEventListener('resize', compute)
    return () => window.removeEventListener('resize', compute)
  }, [])

  const chips = [
    { label: 'Yield',        color: '#10B981' },
    { label: 'Airdrops',     color: '#F59E0B' },
    { label: 'Token launch', color: BLUE_2   },
    { label: 'Founder',      color: '#A78BFA' },
  ]

  return (
    <div style={{ width: 1200 * scale, height: 630 * scale, overflow: 'hidden', borderRadius: 20, boxShadow: '0 40px 120px rgba(0,0,0,0.6)' }}>
      <div ref={captureRef} style={{ width: 1200, height: 630, transform: `scale(${scale})`, transformOrigin: 'top left', background: INK, color: '#fff', padding: '56px 64px', fontFamily: "var(--font-display)", position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Backdrop */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `radial-gradient(rgba(46,112,234,0.22) 1.5px, transparent 1.5px)`, backgroundSize: '36px 36px', maskImage: 'radial-gradient(ellipse 90% 70% at 80% 20%, #000 25%, transparent 75%)', WebkitMaskImage: 'radial-gradient(ellipse 90% 70% at 80% 20%, #000 25%, transparent 75%)', pointerEvents: 'none' }}/>
        <div style={{ position: 'absolute', top: -180, right: -180, width: 620, height: 620, background: `radial-gradient(circle, ${BLUE_2}77 0%, transparent 70%)`, borderRadius: 999, pointerEvents: 'none' }}/>
        <div style={{ position: 'absolute', bottom: -220, left: -120, width: 520, height: 520, background: `radial-gradient(circle, ${BLUE}44 0%, transparent 70%)`, borderRadius: 999, pointerEvents: 'none' }}/>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 2 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/earny-logo.svg" alt="Earny" style={{ height: 42 }}/>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '10px 18px', background: 'rgba(255,255,255,0.08)', border: `1px solid rgba(255,255,255,0.2)`, borderRadius: 999, font: "700 12px/1 var(--font-display)", letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.9)' }}>
            <span style={{ width: 6, height: 6, background: GREEN, borderRadius: 999 }}/>Every way to earn on Base
          </div>
        </div>

        {/* Middle — the number is the star */}
        <div style={{ marginTop: 36, position: 'relative', zIndex: 2, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '8px 18px', background: `linear-gradient(90deg, ${BLUE}55, ${BLUE_2}11)`, border: `1px solid ${BLUE_2}66`, borderRadius: 999, font: "700 13px/1 var(--font-display)", letterSpacing: '0.18em', textTransform: 'uppercase', color: SKY, marginBottom: 14, alignSelf: 'flex-start' }}>
            <span style={{ width: 6, height: 6, background: GREEN, borderRadius: 999 }}/>{cat.toUpperCase()}
          </div>
          <div style={{ font: "400 28px/1 var(--font-serif)", color: 'rgba(255,255,255,0.7)', marginBottom: 6, fontStyle: 'italic' }}>I could be earning</div>
          <div style={{ font: "400 200px/0.92 var(--font-serif)", letterSpacing: '-0.03em', display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ font: "400 104px/1 var(--font-serif)", opacity: 0.7 }}>$</span>
            <span>{total.toLocaleString()}</span>
            <span style={{ font: "400 68px/1 var(--font-serif)", color: 'rgba(255,255,255,0.6)', fontStyle: 'italic' }}>/mo</span>
          </div>
          <div style={{ font: "400 28px/1.2 var(--font-serif)", color: 'rgba(255,255,255,0.85)', marginTop: 10, fontStyle: 'italic' }}>on Base. I just didn&apos;t know where.</div>

          {/* Category chips */}
          <div style={{ display: 'flex', gap: 10, marginTop: 24, flexWrap: 'wrap' }}>
            {chips.map(c => (
              <div key={c.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 16px', background: 'rgba(255,255,255,0.06)', border: `1px solid rgba(255,255,255,0.14)`, borderRadius: 999, font: "600 14px/1 var(--font-display)", color: 'rgba(255,255,255,0.88)' }}>
                <span style={{ width: 8, height: 8, borderRadius: 999, background: c.color }}/>
                {c.label}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', zIndex: 2, position: 'relative' }}>
          <div style={{ font: "400 18px/1.3 var(--font-serif)", color: 'rgba(255,255,255,0.55)', fontStyle: 'italic', maxWidth: 520 }}>Read-only. No connect. No keys. Just your number.</div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ font: "700 11px/1 var(--font-display)", color: 'rgba(255,255,255,0.55)', marginBottom: 8, letterSpacing: '0.22em', textTransform: 'uppercase' }}>Find yours →</div>
            <div style={{ font: "700 32px/1 var(--font-display)", color: '#fff', letterSpacing: '-0.01em' }}>earny.chat</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Share overlay ─────────────────────────────────────────────────────────────
function ShareOverlay({ result, onClose }: { result: AnalyzeResult; onClose: () => void }) {
  const [copied, setCopied] = useState(false)
  const [busy, setBusy]     = useState<'save' | 'share' | null>(null)
  const [hint, setHint]     = useState('')
  const isMobile = useIsMobile()
  const text     = buildShareText(result.totalMonthly)
  const cardRef  = useRef<HTMLDivElement | null>(null)

  const capture = useCallback(async (): Promise<Blob> => {
    if (!cardRef.current) throw new Error('Card not ready')
    // Make sure fonts are ready so the serif heading renders correctly.
    if (document.fonts?.ready) await document.fonts.ready
    const { toBlob } = await import('html-to-image')
    const blob = await toBlob(cardRef.current, {
      pixelRatio: 3,
      cacheBust: true,
      backgroundColor: INK,
      width: 1200,
      height: 630,
      style: { transform: 'scale(1)', transformOrigin: 'top left' },
      canvasWidth: 1200,
      canvasHeight: 630,
    })
    if (!blob) throw new Error('Capture failed')
    return blob
  }, [])

  const saveImage = useCallback(async () => {
    try {
      setBusy('save')
      const blob = await capture()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'earny-share.png'
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (e) {
      console.error(e)
      setHint('Save failed. Try again.')
    } finally {
      setBusy(null)
    }
  }, [capture])

  const nativeShare = useCallback(async () => {
    try {
      setBusy('share')
      const blob = await capture()
      const file = new File([blob], 'earny-share.png', { type: 'image/png' })
      const nav = navigator as Navigator & { canShare?: (d: { files?: File[] }) => boolean }
      if (nav.canShare?.({ files: [file] })) {
        await nav.share({ files: [file], text, title: 'Earny' })
      } else {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'earny-share.png'
        document.body.appendChild(a)
        a.click()
        a.remove()
        setTimeout(() => URL.revokeObjectURL(url), 1000)
        setHint('Image saved. Attach it to your post.')
      }
    } catch (e) {
      if ((e as DOMException)?.name !== 'AbortError') {
        console.error(e)
        setHint('Share failed. Try saving instead.')
      }
    } finally {
      setBusy(null)
    }
  }, [capture, text])

  const shareTwitter = useCallback(async () => {
    try {
      setBusy('share')
      const blob = await capture()
      const file = new File([blob], 'earny-share.png', { type: 'image/png' })
      const nav = navigator as Navigator & { canShare?: (d: { files?: File[] }) => boolean }
      if (isMobile && nav.canShare?.({ files: [file] })) {
        await nav.share({ files: [file], text })
      } else {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'earny-share.png'
        document.body.appendChild(a)
        a.click()
        a.remove()
        setTimeout(() => URL.revokeObjectURL(url), 1000)
        const intent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`
        window.open(intent, '_blank', 'noopener,noreferrer,width=600,height=500')
        setHint('Image downloaded. Attach it to your tweet.')
      }
    } catch (e) {
      if ((e as DOMException)?.name !== 'AbortError') console.error(e)
    } finally {
      setBusy(null)
    }
  }, [capture, text, isMobile])

  const shareFarcaster = useCallback(async () => {
    try {
      setBusy('share')
      const blob = await capture()
      const file = new File([blob], 'earny-share.png', { type: 'image/png' })
      const nav = navigator as Navigator & { canShare?: (d: { files?: File[] }) => boolean }
      if (isMobile && nav.canShare?.({ files: [file] })) {
        await nav.share({ files: [file], text })
      } else {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'earny-share.png'
        document.body.appendChild(a)
        a.click()
        a.remove()
        setTimeout(() => URL.revokeObjectURL(url), 1000)
        const intent = `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}`
        window.open(intent, '_blank', 'noopener,noreferrer,width=600,height=500')
        setHint('Image downloaded. Attach it to your cast.')
      }
    } catch (e) {
      if ((e as DOMException)?.name !== 'AbortError') console.error(e)
    } finally {
      setBusy(null)
    }
  }, [capture, text, isMobile])

  const copyLink = useCallback(() => {
    navigator.clipboard.writeText('https://earny.chat').then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [])

  const hasNativeShare = typeof navigator !== 'undefined' && typeof (navigator as Navigator & { share?: unknown }).share === 'function'

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(10,11,26,0.85)', backdropFilter: 'blur(12px)', zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: isMobile ? 16 : 40, animation: 'fadein .2s', overflow: 'auto' }}
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%', maxWidth: 1220 }}>

        <ShareCard result={result} captureRef={cardRef}/>

        <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: isMobile ? '20px 16px' : '24px 28px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <div>
              <div style={{ font: "600 16px/1.2 var(--font-display)", color: '#fff', marginBottom: 4 }}>Share your results</div>
              <div style={{ font: "400 13px/1.5 var(--font-display)", color: 'rgba(255,255,255,0.5)' }}>
                {isMobile && hasNativeShare ? 'Tap share to post with the image attached.' : 'Save the image, then attach it to your post.'}
              </div>
            </div>
            <button onClick={onClose} style={{ flex: 'none', width: 32, height: 32, borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>✕</button>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={saveImage}
              disabled={busy !== null}
              style={{ ...shareBtnStyle, background: BLUE, color: '#fff', flex: isMobile ? '1 1 45%' : 'none', justifyContent: 'center', padding: '14px 18px', boxShadow: '0 4px 16px rgba(25,109,253,0.3)', opacity: busy === 'save' ? 0.7 : 1 }}
            >
              <DownloadIcon/> {busy === 'save' ? 'Saving…' : 'Save image'}
            </button>
            {isMobile && hasNativeShare && (
              <button
                onClick={nativeShare}
                disabled={busy !== null}
                style={{ ...shareBtnStyle, background: 'rgba(255,255,255,0.14)', color: '#fff', flex: '1 1 45%', justifyContent: 'center', padding: '14px 18px' }}
              >
                Share…
              </button>
            )}
            <button
              onClick={shareTwitter}
              disabled={busy !== null}
              style={{ ...shareBtnStyle, background: '#000', color: '#fff', flex: isMobile ? '1 1 45%' : 'none', justifyContent: 'center', padding: '14px 18px' }}
            >
              <TwitterIcon/> Post to X
            </button>
            <button
              onClick={shareFarcaster}
              disabled={busy !== null}
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

          {hint && (
            <div style={{ marginTop: 14, font: "400 12px/1.4 var(--font-display)", color: 'rgba(255,255,255,0.55)' }}>
              {hint}
            </div>
          )}
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
        />
      )}
      {view === 'error' && <ErrorState message={errorMsg} onReset={reset}/>}

      {showShare && result && <ShareOverlay result={result} onClose={() => setShowShare(false)}/>}
      {proto && <ProtoDetail p={proto} onClose={() => setProto(null)}/>}
    </>
  )
}
