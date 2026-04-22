'use client'

import { useState } from 'react'

// ── Actions ───────────────────────────────────────────────────────────────────
interface Action {
  id: string
  tone: string
  bg: string
  icon: string
  label: string
}

const ACTIONS: Action[] = [
  { id: 'balance', tone: '#34C759', bg: 'rgba(48,209,88,.1)',   icon: '/icon-balance.svg',  label: 'Check your token balances' },
  { id: 'analyse', tone: '#007AFF', bg: 'rgba(0,122,255,.1)',   icon: '/icon-analyse.svg',  label: 'Analyze crypto tokens for market details' },
  { id: 'swap',    tone: '#FF9500', bg: 'rgba(255,149,0,.1)',   icon: '/icon-swap.svg',     label: 'Swap between different tokens' },
  { id: 'send',    tone: '#AF52DE', bg: 'rgba(175,82,222,.1)',  icon: '/icon-send.svg',     label: 'Send ETH or tokens to other wallets' },
  { id: 'invest',  tone: '#5856D6', bg: 'rgba(88,86,214,.1)',   icon: '/icon-invest.svg',   label: 'Set up automated investments with custom risk levels' },
]

// ── Sidebar ───────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: 'home',   label: 'Home',   src: '/icon-home.svg' },
  { id: 'earny',  label: 'Earny',  src: '/icon-earny-menu.svg' },
  { id: 'wallet', label: 'Wallet', src: '/icon-wallet.svg' },
]

function Sidebar({ active, onNav }: { active: string; onNav: (id: string) => void }) {
  return (
    <aside style={{ width: 202, background: '#000', display: 'flex', flexDirection: 'column', padding: '80px 20px', gap: 60, flex: 'none' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/earny-wordmark.svg" alt="Earny" style={{ height: 28, filter: 'invert(1)', alignSelf: 'flex-start' }}/>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        {NAV_ITEMS.map(it => (
          <button
            key={it.id}
            onClick={() => onNav(it.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer',
              color: active === it.id ? '#fff' : 'rgba(255,255,255,.4)',
              background: 'none', border: 'none', padding: 0, font: "500 18px/1.4 var(--font-display)",
            }}
          >
            <span style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={it.src} style={{ width: 20, height: 20, filter: 'invert(1)', opacity: active === it.id ? 1 : .5 }} alt={it.label}/>
            </span>
            <span>{it.label}</span>
          </button>
        ))}
      </nav>
      <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 12, color: 'rgba(255,255,255,.4)' }}>
        <div style={{ width: 32, height: 32, borderRadius: 1000, background: 'linear-gradient(135deg,#FE6C11,#FEB711)', flex: 'none' }}/>
        <span style={{ font: "500 18px/1.4 var(--font-display)" }}>0xjenil</span>
        <span style={{ marginLeft: 'auto', opacity: .6 }}>▾</span>
      </div>
    </aside>
  )
}

// ── Action card ───────────────────────────────────────────────────────────────
function ActionCard({ a, onPick, selected }: { a: Action; onPick: (a: Action) => void; selected: string | null }) {
  const isDim = selected && selected !== a.id
  return (
    <button
      onClick={() => onPick(a)}
      style={{
        width: 216, height: 148, borderRadius: 28, padding: 24,
        background: a.bg, border: `1px solid ${a.tone}`,
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        textAlign: 'left', cursor: 'pointer',
        opacity: isDim ? .35 : 1, transition: 'opacity 150ms ease-out',
        fontFamily: "var(--font-display)",
      }}
    >
      <span style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={a.icon} style={{ width: 24, height: 24 }} alt={a.id}/>
      </span>
      <span style={{ font: "400 16px/1.4 var(--font-display)", color: 'rgba(0,0,0,.8)' }}>{a.label}</span>
    </button>
  )
}

// ── Chat bubble ───────────────────────────────────────────────────────────────
function ChatBubble({ text }: { text: string }) {
  return (
    <div style={{
      alignSelf: 'flex-end', borderRadius: 1000,
      background: 'rgba(10,78,194,.5)', padding: '12px 24px',
      font: "700 18px/1.4 var(--font-display)", color: '#fff',
      maxWidth: 480, textAlign: 'center',
    }}>
      {text}
    </div>
  )
}

// ── Agent greeting ────────────────────────────────────────────────────────────
function AgentGreeting({ onPick, picked }: { onPick: (a: Action) => void; picked: string | null }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <p style={{ font: "400 16px/1.4 var(--font-display)", color: 'rgba(255,255,255,.8)', margin: 0, maxWidth: 720 }}>
        👋 Hey there! I&apos;m Earny, an autonomous onchain agent. I&apos;m designed to simplify complex blockchain interactions while maintaining the security and precision required for digital asset management. How may I assist with your blockchain requirements today?
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, padding: '20px 0' }}>
        {ACTIONS.map(a => <ActionCard key={a.id} a={a} onPick={onPick} selected={picked}/>)}
      </div>
    </div>
  )
}

// ── Amount slider ─────────────────────────────────────────────────────────────
function AmountSlider({ onConfirm }: { onConfirm: (amt: string) => void }) {
  const [v, setV] = useState(22)
  const amt = (15.64 * v / 22).toFixed(2)

  return (
    <div style={{ padding: '20px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <p style={{ font: "400 18px/1.4 var(--font-display)", color: 'rgba(255,255,255,.8)', margin: 0, whiteSpace: 'pre-line' }}>
        {"Sure! I need to know how much you'd like to invest.\nCould you please select an amount?"}
      </p>
      <div style={{ padding: '40px 0 20px' }}>
        <div style={{ position: 'relative', height: 24 }}>
          <div style={{
            position: 'absolute', inset: '8px 0', borderRadius: 4,
            background: 'rgba(255,255,255,.1)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 2px',
          }}>
            {Array.from({ length: 10 }).map((_, i) => <div key={i} style={{ width: 1, height: 4, background: 'rgba(255,255,255,.3)' }}/>)}
          </div>
          <input
            type="range" min="0" max="100" value={v}
            onChange={e => setV(+e.target.value)}
            style={{ position: 'absolute', inset: 0, width: '100%', background: 'transparent', zIndex: 2, cursor: 'pointer' }}
          />
          <div style={{
            position: 'absolute', left: `calc(${v}% - 10px)`, top: 0,
            width: 20, height: 20, borderRadius: 1000,
            background: '#FE6C11', boxShadow: '0 0 0 3px #000, 0 0 0 5px #FE6C11',
            pointerEvents: 'none',
          }}/>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, font: "500 16px/1 var(--font-display)", color: 'rgba(255,255,255,.4)' }}>
          <span>0%</span><span>max</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 40, alignItems: 'center' }}>
        <span style={{ font: "500 20px/1 var(--font-display)", color: '#fff' }}>${amt}</span>
        <button
          onClick={() => onConfirm(amt)}
          style={{
            background: '#FE6C11', color: '#fff', borderRadius: 1000,
            padding: '10px 26px', font: "700 14px/1.4 var(--font-display)",
            border: 'none', cursor: 'pointer',
          }}
        >
          Confirm
        </button>
      </div>
    </div>
  )
}

// ── Activity panel ────────────────────────────────────────────────────────────
interface ActivityEvent {
  tone: string
  title: string
  status: string
}

function Activity({ events }: { events: ActivityEvent[] }) {
  return (
    <div style={{
      flex: 'none', width: 470, borderLeft: '1px solid rgba(255,255,255,.1)',
      padding: '20px 40px 80px', display: 'flex', flexDirection: 'column', gap: 40,
    }}>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 24, height: 24, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="22" height="22" viewBox="0 0 32 32" fill="#fff"><path d="M19.653 23.77H27.87V32h-8.22v-8.23H11.44V32H3.21v-8.23h8.22v-8.23h8.22v8.23Z"/><path d="M15.543 0C24.127 0 31.086 6.96 31.086 15.54H22.88c0-4.05-3.29-7.33-7.34-7.33-4.05 0-7.33 3.28-7.33 7.33H0C0 6.96 6.96 0 15.54 0Z"/></svg>
        </span>
        <h2 style={{ font: "500 28px/1.4 var(--font-display)", color: '#fff', margin: 0 }}>Activity</h2>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {events.length === 0 && (
          <span style={{ font: "italic 16px/1.4 var(--font-display)", color: 'rgba(255,255,255,.4)' }}>Waiting for selection..</span>
        )}
        {events.map((e, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 22, height: 22, borderRadius: 1000, background: e.tone, flex: 'none' }}/>
              <span style={{ font: "500 14px/1.4 var(--font-display)", color: '#fff' }}>{e.title}</span>
            </div>
            <span style={{
              font: "500 12px/1.4 var(--font-display)",
              color: e.status === 'Complete' ? '#34C759' : 'rgba(255,255,255,.4)',
              fontStyle: e.status === 'Pending…' ? 'italic' : 'normal',
            }}>
              {e.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Footer ────────────────────────────────────────────────────────────────────
function DashFooter() {
  return (
    <div style={{ height: 200, margin: 20, borderRadius: 56, background: '#101128', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '68px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/earny-wordmark.svg" style={{ height: 38, filter: 'invert(1)' }} alt="Earny"/>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, font: "400 16px/1.4 var(--font-display)", color: '#2E85FF' }}>
          <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path d="M10 1l1.8 5.2L17 8l-5.2 1.8L10 15l-1.8-5.2L3 8l5.2-1.8L10 1z"/></svg>
          Your Earning Assistant
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
        <a style={{ color: 'rgba(255,255,255,.6)', font: "500 13px/1 var(--font-display)", cursor: 'pointer' }}>Twitter</a>
        <a style={{ color: 'rgba(255,255,255,.6)', font: "500 13px/1 var(--font-display)", cursor: 'pointer' }}>Warpcast</a>
        <a style={{ color: 'rgba(255,255,255,.6)', font: "500 13px/1 var(--font-display)", cursor: 'pointer' }}>LinkedIn</a>
        <span style={{ border: '1px solid rgba(255,255,255,.15)', borderRadius: 6, padding: '8px 12px', fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: 10, letterSpacing: 1, color: 'rgba(255,255,255,.4)' }}>
          POWERED BY <b style={{ color: 'rgba(255,255,255,.8)', fontWeight: 700 }}>EarnKit</b>
        </span>
      </div>
    </div>
  )
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function AgentPage() {
  const [picked, setPicked]     = useState<string | null>(null)
  const [stage, setStage]       = useState<'greeting' | 'amount' | 'done'>('greeting')
  const [events, setEvents]     = useState<ActivityEvent[]>([])
  const [activeNav, setActiveNav] = useState('home')

  const pickAction = (a: Action) => {
    setPicked(a.id)
    setStage('amount')
    setEvents(prev => [{ tone: a.tone, title: `${a.id[0].toUpperCase() + a.id.slice(1)} flow started`, status: 'Pending…' }, ...prev])
  }

  const confirm = (amt: string) => {
    setStage('done')
    setEvents(prev => [{ tone: '#FE6C11', title: `Invest $${amt} · Aerodrome`, status: 'Complete' }, ...prev])
  }

  return (
    <div style={{ width: '100%', minHeight: '100vh', background: '#1A2238', display: 'flex', fontFamily: "var(--font-display)" }}>
      <Sidebar active={activeNav} onNav={setActiveNav}/>
      <div style={{ flex: 1, padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ background: '#000', borderRadius: 56, display: 'flex', flex: 1, overflow: 'hidden' }}>
          <section style={{ flex: '1 1 800px', padding: '20px 40px', display: 'flex', flexDirection: 'column', gap: 40, overflow: 'auto' }}>
            <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <span style={{ width: 24, height: 24, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="22" height="22" viewBox="0 0 32 32" fill="#fff"><path d="M19.653 23.77H27.87V32h-8.22v-8.23H11.44V32H3.21v-8.23h8.22v-8.23h8.22v8.23Z"/><path d="M15.543 0C24.127 0 31.086 6.96 31.086 15.54H22.88c0-4.05-3.29-7.33-7.34-7.33-4.05 0-7.33 3.28-7.33 7.33H0C0 6.96 6.96 0 15.54 0Z"/></svg>
              </span>
              <h2 style={{ font: "500 28px/1.4 var(--font-display)", color: '#fff', margin: 0 }}>Agent</h2>
            </header>

            <AgentGreeting onPick={pickAction} picked={picked}/>

            {stage !== 'greeting' && (
              <ChatBubble text={ACTIONS.find(a => a.id === picked)?.label ?? ''}/>
            )}
            {(stage === 'amount' || stage === 'done') && (
              <AmountSlider onConfirm={confirm}/>
            )}
            {stage === 'done' && (
              <>
                <ChatBubble text="Confirm"/>
                <p style={{ font: "italic 16px/1.4 var(--font-display)", color: 'rgba(255,255,255,.4)', margin: 0 }}>
                  Transaction submitted. Watching the Activity panel…
                </p>
              </>
            )}
          </section>

          <Activity events={events}/>
        </div>

        <DashFooter/>
      </div>
    </div>
  )
}
