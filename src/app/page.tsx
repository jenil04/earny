'use client'

import { useState, useEffect } from 'react'

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

// ── Data ─────────────────────────────────────────────────────────────────────
interface Protocol {
  id: string
  name: string
  tagline: string
  brand: string
  initials: string
  asset: string
  size: string
  action: string
  detail: string
  yieldPct: number
  monthly: number
  trust: number
  steps: string[]
  link: string
}

const PROTOS: Protocol[] = [
  { id:'arma',     name:'ARMA',        tagline:'Automated yield router on Base',    brand:'#B6E02A', initials:'AR', asset:'USDC',  size:'1,240 USDC', action:"Route 1,240 USDC into ARMA's top USDC vault",     detail:'ARMA moves your stablecoins between the best-yielding vaults on Base automatically. Set and forget.', yieldPct:14.8, monthly:15.30, trust:2, steps:['Open arma.xyz and connect','Pick the USDC smart vault','Deposit — ARMA does the rest'],                         link:'https://arma.xyz' },
  { id:'aave',     name:'Aave v3',     tagline:'The original lending market',       brand:'#B6509E', initials:'AA', asset:'USDbC', size:'820 USDbC',   action:'Supply 820 USDbC at variable rate',                detail:'The largest, most battle-tested lending market in DeFi. Lower APY but virtually bulletproof.',       yieldPct:5.1,  monthly:41.85, trust:3, steps:['Open Aave on Base','Supply USDbC','Earn — or borrow against it later'],                                link:'https://aave.com' },
  { id:'compound', name:'Compound v3', tagline:'Simple, safe lending',              brand:'#D26CAD', initials:'CO', asset:'USDC',  size:'640 USDC',    action:'Supply 640 USDC to the Base market',               detail:'Single-asset borrow markets. Less flexible than Aave but simpler risk profile.',                     yieldPct:6.2,  monthly:33.07, trust:3, steps:['Open Compound v3','Select the Base USDC market','Supply and start earning'],                          link:'https://app.compound.finance' },
  { id:'fluid',    name:'Fluid',       tagline:'Next-gen lending + DEX',            brand:'#5DD4D1', initials:'FL', asset:'ETH',   size:'0.48 ETH',    action:'Supply 0.48 ETH to the Fluid ETH vault',           detail:'Fluid combines lending and AMM liquidity for higher effective yield. Newer protocol — solid audits.', yieldPct:8.9,  monthly:71.20, trust:2, steps:['Open fluid.instadapp.io','Pick the ETH vault','Deposit ETH'],                                        link:'https://fluid.instadapp.io' },
  { id:'morpho',   name:'Morpho',      tagline:'Peer-matched lending, better rates', brand:'#2E6CF6',initials:'MO', asset:'ETH',   size:'0.48 ETH',    action:'Lend 0.48 ETH in the Blue ETH-USDC vault',         detail:'Morpho pairs lenders and borrowers directly so you get better rates than plain Aave or Compound.',    yieldPct:6.4,  monthly:61.30, trust:3, steps:['Open Morpho Blue','Pick the ETH-USDC vault','Deposit — interest accrues every block'],             link:'https://morpho.org' },
  { id:'moonwell', name:'Moonwell',    tagline:'Base-native lending with rewards',  brand:'#C07A4B', initials:'MW', asset:'USDC',  size:'520 USDC',    action:'Supply 520 USDC and collect WELL rewards',         detail:'Extra APY from WELL token rewards on top of the base interest rate.',                                yieldPct:7.4,  monthly:32.06, trust:2, steps:['Open moonwell.fi on Base','Supply USDC','Claim WELL rewards weekly'],                                link:'https://moonwell.fi' },
  { id:'seamless', name:'Seamless',    tagline:'Native Base lending',               brand:'#82B8C2', initials:'SE', asset:'USDbC', size:'300 USDbC',   action:'Supply 300 USDbC + earn SEAM',                     detail:'Base-native fork of Aave with SEAM token incentives for early users.',                               yieldPct:8.2,  monthly:20.50, trust:1, steps:['Open seamlessprotocol.com','Supply USDbC','Collect SEAM emissions'],                                 link:'https://seamlessprotocol.com' },
  { id:'ample',    name:'Ample.money', tagline:'Highest stablecoin yield on Base',  brand:'#F26B3A', initials:'AM', asset:'USDC',  size:'400 USDC',    action:"Deposit 400 USDC into Ample's aUSDC vault",        detail:'Ample routes into the highest-yielding venues on Base, rebalancing daily. Higher returns, newer protocol.', yieldPct:16.4, monthly:54.67, trust:3, steps:['Open ample.money','Pick the aUSDC vault','Deposit USDC'],                                          link:'https://ample.money' },
].filter(p => p.monthly >= 5)

const TOTAL = PROTOS.reduce((s, p) => s + p.monthly, 0)
const TOTAL_ROUNDED = Math.round(TOTAL)

function categoryFor(amount: number) {
  if (amount < 50)   return { tier: 'Sleeper' }
  if (amount < 150)  return { tier: 'Idle Earner' }
  if (amount < 400)  return { tier: 'Yield Curious' }
  if (amount < 1000) return { tier: 'Onchain Saver' }
  if (amount < 3000) return { tier: 'DeFi Native' }
  return               { tier: 'Whale Asleep' }
}

function formatAddr(a: string) {
  if (!a) return '—'
  if (a.startsWith('0x') && a.length > 12) return a.slice(0, 10) + '…' + a.slice(-6)
  return a
}

// ── Shared button styles ──────────────────────────────────────────────────────
const primaryBtnStyle: React.CSSProperties = {
  font: "600 16px/1 var(--font-display)", background: BLUE, color: '#fff',
  border: 'none', padding: '16px 24px', borderRadius: 999, cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', gap: 10,
  boxShadow: '0 8px 24px rgba(25,109,253,0.3)',
}
const secondaryBtnStyle: React.CSSProperties = {
  font: "600 16px/1 var(--font-display)", background: '#fff', color: INK,
  border: `1px solid rgba(10,11,26,0.12)`, padding: '16px 24px', borderRadius: 999, cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', gap: 10,
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
      const eased = 1 - Math.pow(1 - p, 3)
      setN(value * eased)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value])
  return <span style={{ fontVariantNumeric: 'tabular-nums' }}>{n.toFixed(2)}</span>
}

function ProtoDisc({ p, size = 44 }: { p: Protocol; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: 999,
      background: p.brand, color: '#fff',
      display: 'grid', placeItems: 'center',
      font: `700 ${Math.round(size * 0.36)}px/1 var(--font-display)`,
      letterSpacing: '-0.02em',
      boxShadow: 'inset 0 -2px 0 rgba(0,0,0,0.12)',
      flex: 'none',
    }}>
      {p.initials}
    </div>
  )
}

function TrustMeter({ level }: { level: number }) {
  const labels = ['Low', 'Medium', 'High']
  const colors = ['#E08A45', '#E6B93A', '#10B981']
  const c = colors[level - 1]
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end' }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{ width: 5, height: 6 + i * 4, borderRadius: 2, background: i <= level ? c : 'rgba(10,11,26,0.12)' }}/>
        ))}
      </div>
      <span style={{ font: "600 13px/1 var(--font-display)", color: c }}>{labels[level - 1]}</span>
    </div>
  )
}

function AddrChip({ addr }: { addr: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '10px 16px', background: '#fff',
      border: `1px solid rgba(10,11,26,0.08)`, borderRadius: 999,
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
    <a
      href="https://clanker.world/clanker/0x534b7aAD1Cdb6F02eC48CAbe428f0D9131E40B07"
      target="_blank" rel="noopener noreferrer"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 10,
        padding: '9px 18px', background: bg,
        border: `1.5px solid ${border}`, borderRadius: 999,
        font: "700 12px/1 var(--font-display)", letterSpacing: '0.1em',
        color: text, textDecoration: 'none', whiteSpace: 'nowrap',
      }}
    >
      <span style={{ width: 8, height: 8, background: GREEN, borderRadius: 999, boxShadow: `0 0 0 3px ${dark ? 'rgba(16,185,129,0.2)' : 'rgba(16,185,129,0.15)'}` }}/>
      <span style={{ color: link, textDecoration: 'underline', textUnderlineOffset: 2, textDecorationThickness: 1.5 }}>MINI</span>
      <span>IS THE ONLY OFFICIAL TOKEN.</span>
    </a>
  )
}

function SiteFooter({ dark = true }: { dark?: boolean }) {
  const fg       = dark ? 'rgba(255,255,255,0.55)' : INK_MUTED
  const fgStrong = dark ? 'rgba(255,255,255,0.9)'  : INK
  const border   = dark ? 'rgba(255,255,255,0.08)' : 'rgba(10,11,26,0.08)'
  return (
    <footer style={{
      padding: '32px 40px', borderTop: `1px solid ${border}`,
      display: 'flex', flexWrap: 'wrap', gap: 24,
      justifyContent: 'space-between', alignItems: 'center',
      font: "400 13px/1.4 var(--font-display)", color: fg,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span>Built by</span>
        <a href="https://x.com/jenilt" target="_blank" rel="noopener noreferrer"
           style={{ color: fgStrong, textDecoration: 'none', fontWeight: 600 }}>@jenilt</a>
      </div>
      <div>earny.chat — read-only, never moves your funds.</div>
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
  const valid = /^0x[a-fA-F0-9]{40}$/.test(addr.trim())

  return (
    <div style={{
      minHeight: '100vh', background: INK, color: '#fff',
      fontFamily: "var(--font-display)",
      display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden',
    }}>
      <GridBackdrop/>
      <AuraBlob/>

      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '26px 40px', position: 'relative', zIndex: 3 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/earny-logo.svg" alt="Earny" style={{ height: 30, display: 'block' }}/>
        <nav style={{ display: 'flex', gap: 28, font: "500 15px/1 var(--font-display)", color: 'rgba(255,255,255,0.75)', alignItems: 'center' }}>
          <a href="#how" style={{ color: 'inherit', textDecoration: 'none' }}>How it works</a>
        </nav>
      </header>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px 80px', position: 'relative', zIndex: 2 }}>
        <MiniPill dark/>

        <h1 style={{
          font: "400 clamp(48px, 6.5vw, 96px)/1.05 var(--font-serif)",
          letterSpacing: '-0.02em', textAlign: 'center', margin: '28px 0 36px', maxWidth: 1100,
        }}>
          <span style={{ whiteSpace: 'nowrap' }}>
            You&apos;re leaving <em style={{ color: BLUE_2, fontStyle: 'italic', letterSpacing: '0.04em' }}>$ _____</em>
          </span>
          <br/>
          <span style={{ whiteSpace: 'nowrap' }}>on the table every month.</span>
        </h1>

        <p style={{
          font: "400 clamp(18px, 1.8vw, 22px)/1.45 var(--font-display)",
          color: 'rgba(255,255,255,0.68)', textAlign: 'center', maxWidth: 620, margin: '0 0 44px',
        }}>
          Earny is your onchain CFO. Paste your wallet and let Earny tell you exactly how much you can earn monthly.
        </p>

        <form
          onSubmit={(e) => { e.preventDefault(); if (valid) onAnalyze(addr.trim()) }}
          style={{
            display: 'flex', gap: 8, padding: 8, background: '#fff', borderRadius: 999,
            boxShadow: '0 30px 80px rgba(25,109,253,0.22), 0 2px 0 rgba(255,255,255,0.4) inset',
            width: 'min(640px, 92vw)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', paddingLeft: 20, color: INK_MUTED }}>
            <WalletGlyph/>
          </div>
          <input
            value={addr}
            onChange={(e) => setAddr(e.target.value)}
            placeholder="paste a wallet address (0x…)"
            style={{
              flex: 1, border: 'none', outline: 'none', background: 'transparent',
              font: "500 18px/1 var(--font-display)", color: INK, padding: '0 4px', minWidth: 0,
            }}
          />
          <button
            type="submit"
            disabled={!valid}
            style={{
              border: 'none', cursor: valid ? 'pointer' : 'not-allowed',
              background: valid ? BLUE : '#CFD7E5', color: '#fff',
              font: "600 16px/1 var(--font-display)", padding: '0 28px',
              borderRadius: 999, height: 52,
              display: 'flex', alignItems: 'center', gap: 8,
              transition: 'transform .15s, background .15s',
            }}
            onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.97)' }}
            onMouseUp={(e)   => { e.currentTarget.style.transform = '' }}
            onMouseLeave={(e)=> { e.currentTarget.style.transform = '' }}
          >
            Check mine <Arrow/>
          </button>
        </form>

        <button
          onClick={() => onAnalyze('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045')}
          style={{
            marginTop: 18, background: 'transparent', color: 'rgba(255,255,255,0.55)',
            border: 'none', font: "500 14px/1 var(--font-display)", cursor: 'pointer',
            textDecoration: 'underline', textUnderlineOffset: 4,
          }}
        >
          or try a sample wallet →
        </button>

        <div id="protocols" style={{ marginTop: 88, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
          <div style={{ font: "500 12px/1 var(--font-display)", color: 'rgba(255,255,255,0.4)', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
            Matched to the protocols we trust
          </div>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 780 }}>
            {PROTOS.map(p => (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 16px 10px 10px',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 999, font: "600 15px/1 var(--font-display)", color: 'rgba(255,255,255,0.9)',
              }}>
                <ProtoDisc p={p} size={26}/>{p.name}
              </div>
            ))}
          </div>
        </div>

        <div id="how" style={{ marginTop: 100, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, maxWidth: 980, width: '100%' }}>
          <HowStep n="01" title="Paste your wallet"       body="No signing, no connecting. Earny only reads public onchain data."/>
          <HowStep n="02" title="See what you're missing" body="Every idle asset gets matched with the best yield on Base."/>
          <HowStep n="03" title="Start earning"           body="One-tap links straight to the source. You stay in control."/>
        </div>
      </main>

      <SiteFooter dark/>
    </div>
  )
}

// ── Analyzing ─────────────────────────────────────────────────────────────────
function Analyzing({ addr, onDone }: { addr: string; onDone: () => void }) {
  const [step, setStep] = useState(0)
  const steps = [
    'Reading your wallet',
    'Checking token balances',
    'Scanning yield opportunities',
    'Finding unclaimed rewards',
    "Tallying what you're missing",
  ]

  useEffect(() => {
    if (step >= steps.length) {
      const t = setTimeout(onDone, 500)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setStep(s => s + 1), 650)
    return () => clearTimeout(t)
  }, [step, steps.length, onDone])

  return (
    <div style={{
      minHeight: '100vh', background: INK, color: '#fff',
      fontFamily: "var(--font-display)",
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 40, gap: 40, position: 'relative', overflow: 'hidden',
    }}>
      <GridBackdrop/>
      <AuraBlob/>
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 36 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 999, background: `conic-gradient(${BLUE_2}, transparent)`, animation: 'spin 1.2s linear infinite' }}/>
          <span style={{ font: "500 20px/1 var(--font-display)", color: 'rgba(255,255,255,0.8)' }}>
            Analysing {formatAddr(addr)}
          </span>
        </div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 14, minWidth: 360 }}>
          {steps.map((s, i) => (
            <li key={i} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              font: "500 17px/1.3 var(--font-display)",
              color: i < step ? '#fff' : 'rgba(255,255,255,0.35)',
              transition: 'color .3s',
            }}>
              <span style={{
                width: 22, height: 22, borderRadius: 999, flex: 'none',
                display: 'grid', placeItems: 'center',
                background: i < step ? BLUE_2 : 'rgba(255,255,255,0.08)',
                color: '#fff', font: "700 12px/1 var(--font-display)",
                transition: 'background .3s',
              }}>
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
function ProtoCard({ p, rank, onOpen }: { p: Protocol; rank: number; onOpen: () => void }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onClick={onOpen}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'grid',
        gridTemplateColumns: '36px 56px 1.5fr 110px 140px 150px 24px',
        gap: 20, alignItems: 'center', padding: '18px 24px',
        background: '#fff', borderRadius: 16,
        border: `1px solid ${hover ? BLUE : 'rgba(10,11,26,0.06)'}`,
        textAlign: 'left', color: 'inherit',
        transition: 'border-color .15s, transform .15s, box-shadow .15s',
        transform: hover ? 'translateX(4px)' : 'none',
        boxShadow: hover ? '0 8px 24px rgba(25,109,253,0.08)' : 'none',
        cursor: 'pointer', width: '100%',
      }}
    >
      <div style={{ font: "500 14px/1 var(--font-display)", color: INK_DIM }}>#{String(rank).padStart(2, '0')}</div>
      <ProtoDisc p={p} size={44}/>
      <div>
        <div style={{ font: "700 18px/1.1 var(--font-display)", marginBottom: 4 }}>{p.name}</div>
        <div style={{ font: "400 14px/1.4 var(--font-display)", color: INK_MUTED }}>{p.action}</div>
      </div>
      <div>
        <div style={{ font: "500 11px/1 var(--font-display)", color: INK_DIM, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>Yield</div>
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

// ── Results ───────────────────────────────────────────────────────────────────
function Results({ addr, onShare, onReset, onOpenProto }: {
  addr: string
  onShare: () => void
  onReset: () => void
  onOpenProto: (p: Protocol) => void
}) {
  return (
    <div style={{ minHeight: '100vh', background: CREAM, color: INK, fontFamily: "var(--font-display)" }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 40px', borderBottom: `1px solid rgba(10,11,26,0.06)` }}>
        <button onClick={onReset} style={{ display: 'flex', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/earny-logo-dark.svg" alt="Earny" style={{ height: 28, display: 'block' }}/>
        </button>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <MiniPill/>
          <AddrChip addr={addr}/>
          <button onClick={onReset} style={linkBtnStyle}>New wallet</button>
        </div>
      </header>

      <section style={{ padding: '64px 40px 40px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ font: "500 13px/1 var(--font-display)", color: BLUE, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 20 }}>
          Based on what this wallet holds
        </div>
        <h1 style={{
          font: "400 clamp(96px, 13vw, 180px)/1 var(--font-serif)",
          letterSpacing: '-0.02em', margin: 0, color: INK,
          display: 'flex', alignItems: 'baseline', gap: 8,
        }}>
          <span style={{ font: 'inherit', color: INK_DIM, fontSize: '0.46em' }}>$</span>
          <AnimatedNumber value={TOTAL}/>
        </h1>
        <div style={{ marginTop: 10, font: "400 clamp(36px, 4.2vw, 64px)/1 var(--font-serif)", color: INK_MUTED, fontStyle: 'italic', letterSpacing: '-0.02em' }}>/mo</div>
        <p style={{ font: "400 20px/1.5 var(--font-display)", color: INK_MUTED, marginTop: 20, maxWidth: 680 }}>
          That&apos;s what your assets <em style={{ fontFamily: "var(--font-serif)", fontStyle: 'italic', color: INK, fontSize: 22 }}>could</em> be earning each month if every holding was routed to the best spot. Read-only — nothing to sign, nothing moves.
        </p>
        <div style={{ display: 'flex', gap: 12, marginTop: 32, flexWrap: 'wrap' }}>
          <button onClick={onShare} style={primaryBtnStyle}><ShareIcon/> Share</button>
          <button onClick={() => alert('Chat with Earny — coming soon.')} style={secondaryBtnStyle}><ChatIcon/> Chat with Earny</button>
        </div>
      </section>

      <section style={{ padding: '24px 40px 80px', maxWidth: 1200, margin: '0 auto' }}>
        <h2 style={{ font: "400 clamp(32px, 3.2vw, 44px)/1.1 var(--font-serif)", letterSpacing: '-0.01em', margin: '0 0 8px' }}>Where the money is</h2>
        <div style={{ font: "500 14px/1 var(--font-display)", color: INK_DIM, marginBottom: 24 }}>Top {PROTOS.length} opportunities · tap any card to see how</div>
        <div style={{ display: 'grid', gap: 12 }}>
          {PROTOS.map((p, i) => <ProtoCard key={p.id} p={p} rank={i + 1} onOpen={() => onOpenProto(p)}/>)}
        </div>
        <div style={{ marginTop: 40, padding: 24, background: PAPER, borderRadius: 20, border: `1px solid ${BLUE_SOFT}`, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <div style={{ flex: 'none', width: 40, height: 40, borderRadius: 999, background: BLUE_TINT, display: 'grid', placeItems: 'center', color: BLUE }}>
            <InfoIcon/>
          </div>
          <div>
            <div style={{ font: "600 15px/1.3 var(--font-display)", marginBottom: 4 }}>How we got this number</div>
            <div style={{ font: "400 14px/1.5 var(--font-display)", color: INK_MUTED, maxWidth: 760 }}>
              We read your token balances onchain, then match each asset to the best yield across the protocols we trust. Rates refresh every 15 minutes. Earny never moves your money — you decide what to do.
            </div>
          </div>
        </div>
      </section>

      <SiteFooter dark={false}/>
    </div>
  )
}

// ── Proto detail modal ────────────────────────────────────────────────────────
function ProtoDetail({ p, onClose }: { p: Protocol; onClose: () => void }) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(10,11,26,0.55)', backdropFilter: 'blur(10px)', zIndex: 90, display: 'grid', placeItems: 'center', padding: 24, animation: 'fadein .2s' }}
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(560px, 100%)', background: CREAM, borderRadius: 24, overflow: 'hidden', boxShadow: '0 40px 120px rgba(10,11,26,0.5)' }}>
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
            <StatBlock label="Yield"      value={`${p.yieldPct}%`}/>
            <StatBlock label="Each month" value={`+$${p.monthly.toFixed(2)}`} accent={BLUE}/>
            <StatBlock label="Size"       value={p.size}/>
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

// ── Share overlay ─────────────────────────────────────────────────────────────
function ShareCard({ addr: _addr }: { addr: string }) {
  const [scale, setScale] = useState(1)
  const cat = categoryFor(TOTAL)

  useEffect(() => {
    const compute = () => {
      const maxW = Math.min(1220, window.innerWidth - 80)
      setScale(Math.min(1, maxW / 1200))
    }
    compute()
    window.addEventListener('resize', compute)
    return () => window.removeEventListener('resize', compute)
  }, [])

  return (
    <div style={{ width: 1200 * scale, height: 630 * scale, overflow: 'hidden', borderRadius: 24, boxShadow: '0 40px 120px rgba(0,0,0,0.6)' }}>
      <div style={{
        width: 1200, height: 630,
        transform: `scale(${scale})`, transformOrigin: 'top left',
        background: INK, color: '#fff', padding: 64,
        fontFamily: "var(--font-display)",
        position: 'relative', overflow: 'hidden',
      }}>
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
            <span style={{ width: 6, height: 6, background: GREEN, borderRadius: 999 }}/>{cat.tier.toUpperCase()}
          </div>
          <div style={{ font: "400 24px/1 var(--font-serif)", color: 'rgba(255,255,255,0.55)', marginBottom: 10, fontStyle: 'italic' }}>I&apos;m leaving</div>
          <div style={{ font: "400 190px/0.95 var(--font-serif)", letterSpacing: '-0.02em', display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ font: "400 100px/1 var(--font-serif)", opacity: 0.65 }}>$</span>
            <span>{TOTAL_ROUNDED.toLocaleString()}</span>
          </div>
          <div style={{ marginTop: 12, font: "400 64px/1 var(--font-serif)", color: 'rgba(255,255,255,0.6)', fontStyle: 'italic', letterSpacing: '-0.02em' }}>/mo</div>
          <div style={{ font: "400 26px/1.25 var(--font-serif)", color: 'rgba(255,255,255,0.8)', marginTop: 14, fontStyle: 'italic', maxWidth: 820 }}>on the table. Earny showed me where.</div>
        </div>

        <div style={{ position: 'absolute', bottom: 48, left: 64, right: 64, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', zIndex: 2 }}>
          <div style={{ font: "400 20px/1.3 var(--font-serif)", color: 'rgba(255,255,255,0.7)', fontStyle: 'italic', maxWidth: 420 }}>Earny is your onchain CFO.</div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ font: "500 12px/1 var(--font-display)", color: 'rgba(255,255,255,0.5)', marginBottom: 8, letterSpacing: '0.18em', textTransform: 'uppercase' }}>Check yours →</div>
            <div style={{ font: "600 28px/1 var(--font-display)", color: '#fff' }}>earny.chat</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ShareOverlay({ addr, onClose }: { addr: string; onClose: () => void }) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(10,11,26,0.75)', backdropFilter: 'blur(8px)', zIndex: 100, display: 'grid', placeItems: 'center', padding: 40, animation: 'fadein .2s', overflow: 'auto' }}
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1220 }}>
        <ShareCard addr={addr}/>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ font: "400 13px/1.4 var(--font-display)", color: 'rgba(255,255,255,0.7)', maxWidth: 460 }}>1200×630 · feed-ready. Right-click the card to save as PNG.</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button style={shareBtnStyle}><TwitterIcon/> Post to X</button>
            <button style={shareBtnStyle}><DownloadIcon/> Download</button>
            <button style={{ ...shareBtnStyle, background: 'rgba(255,255,255,0.15)', color: '#fff' }}>Copy link</button>
            <button onClick={onClose} style={{ ...shareBtnStyle, background: 'rgba(255,255,255,0.08)', color: '#fff' }}>Close</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function Page() {
  const [view, setView]           = useState<'landing' | 'analyzing' | 'results'>('landing')
  const [addr, setAddr]           = useState('')
  const [showShare, setShowShare] = useState(false)
  const [proto, setProto]         = useState<Protocol | null>(null)

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('earny-demo') || '{}')
      if (saved.view) { setView(saved.view); setAddr(saved.addr || '') }
    } catch {}
  }, [])

  useEffect(() => {
    try { localStorage.setItem('earny-demo', JSON.stringify({ view, addr })) } catch {}
  }, [view, addr])

  return (
    <>
      {view === 'landing'   && <Landing   onAnalyze={(a) => { setAddr(a); setView('analyzing') }}/>}
      {view === 'analyzing' && <Analyzing addr={addr} onDone={() => setView('results')}/>}
      {view === 'results'   && <Results   addr={addr} onShare={() => setShowShare(true)} onReset={() => { setView('landing'); setAddr('') }} onOpenProto={(p) => setProto(p)}/>}
      {showShare && <ShareOverlay addr={addr || '0x0000000000000000000000000000000000000000'} onClose={() => setShowShare(false)}/>}
      {proto     && <ProtoDetail  p={proto} onClose={() => setProto(null)}/>}
    </>
  )
}
