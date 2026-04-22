import { NextRequest, NextResponse } from 'next/server'
import { isAddress } from 'viem'
import { getBalances } from '@/lib/wallet'
import { getPositions } from '@/lib/positions'
import { getFirstInbound } from '@/lib/alchemy'
import { getBasePools, getEthPrice, findBestPool } from '@/lib/defi-llama'
import { PROTOCOL_DEFS } from '@/lib/protocols'
import { rateLimit, clientIp } from '@/lib/rate-limit'
import { pickArchetype } from '@/lib/archetype'
import type { Opportunity, AnalyzeResult, Rate, CurrentPosition } from '@/types'

// Ensure every numeric value in the JSON response is a finite number.
// NaN/Infinity serialize to null, which breaks client-side typed access.
const safe = (n: number, fallback = 0) => (Number.isFinite(n) ? n : fallback)
const round2 = (n: number) => Math.round(safe(n) * 100) / 100
const round1 = (n: number) => Math.round(safe(n) * 10) / 10

type Outcome = { ok: true; result: AnalyzeResult } | { ok: false; status: number; error: string }

// Request coalescing: if N users request the same wallet in the same instant,
// run the analysis once and hand each caller the same promise. Dramatically
// reduces upstream load during viral spikes where a few wallets get re-viewed.
const inflight = new Map<string, Promise<Outcome>>()

async function getOrCompute(address: string): Promise<Outcome> {
  const existing = inflight.get(address)
  if (existing) return existing
  const p = computeAnalysis(address).finally(() => inflight.delete(address))
  inflight.set(address, p)
  return p
}

export async function GET(req: NextRequest) {
  const ip = clientIp(req)
  const rl = rateLimit(ip)
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Too many requests, slow down.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter), 'Cache-Control': 'no-store' } }
    )
  }

  const raw = req.nextUrl.searchParams.get('address') ?? ''
  // Reject obviously malicious input before touching upstreams.
  if (raw.length > 64) {
    return NextResponse.json({ error: 'Invalid Ethereum address' }, { status: 400, headers: { 'Cache-Control': 'no-store' } })
  }
  // Normalize casing so non-checksummed input (common when pasted) is accepted.
  const address = /^0x[0-9a-fA-F]{40}$/.test(raw.trim()) ? raw.trim().toLowerCase() : ''
  if (!address || !isAddress(address)) {
    return NextResponse.json({ error: 'Invalid Ethereum address' }, { status: 400, headers: { 'Cache-Control': 'no-store' } })
  }

  const outcome = await getOrCompute(address)
  if (!outcome.ok) {
    return NextResponse.json({ error: outcome.error }, { status: outcome.status, headers: { 'Cache-Control': 'no-store' } })
  }
  // Cache successful analyses at the edge for 2 minutes, serve stale up to 10
  // more while revalidating. Same-address refreshes during a viral moment hit
  // the CDN, not our upstreams.
  return NextResponse.json(outcome.result, {
    headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600' },
  })
}

async function computeAnalysis(address: string): Promise<Outcome> {
  try {
    // Critical dependencies (balances, pools, price) must succeed; enrichments
    // (positions, firstInbound) degrade gracefully so a flaky upstream doesn't
    // break the whole analysis.
    const [balancesR, ethPriceR, poolsR, positionsR, firstInboundR] = await Promise.allSettled([
      getBalances(address),
      getEthPrice(),
      getBasePools(),
      getPositions(address as `0x${string}`),
      getFirstInbound(address),
    ])

    if (balancesR.status === 'rejected') {
      console.error('[analyze] balances failed', balancesR.reason)
      return { ok: false, status: 502, error: 'Could not read wallet balances. Try again shortly.' }
    }
    if (poolsR.status === 'rejected') {
      console.error('[analyze] pools failed', poolsR.reason)
      return { ok: false, status: 503, error: 'Yield data temporarily unavailable. Try again shortly.' }
    }
    if (ethPriceR.status === 'rejected') {
      console.error('[analyze] eth price failed', ethPriceR.reason)
      return { ok: false, status: 503, error: 'Price data temporarily unavailable. Try again shortly.' }
    }

    const balances   = balancesR.value
    const ethPrice   = ethPriceR.value
    const pools      = poolsR.value
    const positions  = positionsR.status === 'fulfilled' ? positionsR.value : []
    const firstInbound = firstInboundR.status === 'fulfilled' ? firstInboundR.value : {}

    if (positionsR.status === 'rejected') console.error('[analyze] positions failed (non-fatal)', positionsR.reason)
    if (firstInboundR.status === 'rejected') console.error('[analyze] firstInbound failed (non-fatal)', firstInboundR.reason)

    // APY resolver — reused for opportunities, positions, and all rates.
    const apyForDef = (def: typeof PROTOCOL_DEFS[number]): number | undefined => {
      const pool = findBestPool(pools, def.llamaProject, def.llamaSymbol, {
        minTvl:         def.llamaMinTvl,
        sortBy:         def.llamaSortBy,
        excludeSymbols: def.llamaExclude,
      })
      const apy = def.fallbackApy ?? pool?.apy
      return Number.isFinite(apy) && (apy as number) > 0 ? (apy as number) : undefined
    }

    // Deposited balance per asset, derived from positions (aTokens, Compound markets).
    const depositedByAsset: Record<'USDC' | 'ETH', number> = { USDC: 0, ETH: 0 }
    for (const p of positions) depositedByAsset[p.asset] += safe(p.amount)

    const ethIdle   = safe(balances.ETH) + safe(balances.WETH)
    const usdcIdle  = safe(balances.USDC)
    const ethTotal  = ethIdle + depositedByAsset.ETH
    const usdcTotal = usdcIdle + depositedByAsset.USDC
    const totalPortfolioUsd = ethTotal * ethPrice + usdcTotal + safe(balances.USDbC)

    const opportunities: Opportunity[] = []

    for (const def of PROTOCOL_DEFS) {
      let balanceAmount: number
      let balanceUsd: number
      let assetLabel: string

      if (def.token === 'ETH') {
        balanceAmount = ethTotal
        balanceUsd    = ethTotal * ethPrice
        assetLabel    = 'ETH'
      } else if (def.token === 'USDC') {
        balanceAmount = usdcTotal
        balanceUsd    = usdcTotal
        assetLabel    = 'USDC'
      } else {
        balanceAmount = safe(balances.USDbC)
        balanceUsd    = safe(balances.USDbC)
        assetLabel    = 'USDbC'
      }

      // alwaysShow protocols use total portfolio value if no matching balance
      if (def.alwaysShow && balanceUsd < 1) {
        if (totalPortfolioUsd < 1) continue
        balanceUsd    = totalPortfolioUsd
        balanceAmount = totalPortfolioUsd
        assetLabel    = 'USDC'
      }

      if (balanceUsd < 1) continue

      const apy = apyForDef(def)
      if (!apy) continue

      const monthly = (balanceUsd * apy) / 100 / 12

      const sizeStr =
        def.token === 'ETH'
          ? `${balanceAmount.toFixed(4)} ETH`
          : `${Math.floor(balanceAmount).toLocaleString('en-US')} ${assetLabel}`

      opportunities.push({
        id:       def.id,
        name:     def.name,
        tagline:  def.tagline,
        brand:    def.brand,
        initials: def.initials,
        logo:     def.logo,
        asset:    assetLabel,
        size:     sizeStr,
        action:   `Supply ${assetLabel} to ${def.name}`,
        detail:   def.detail,
        yieldPct: round1(apy),
        monthly:  round2(monthly),
        trust:    def.trust,
        steps:    def.steps,
        link:     def.link,
        variable: def.variable,
      })
    }

    // Highest monthly earnings first
    opportunities.sort((a, b) => b.monthly - a.monthly)

    // Potential total = best (highest monthly) non-variable opportunity per asset type.
    const seenAsset = new Set<string>()
    const totalMonthly = round2(
      opportunities.reduce((s, o) => {
        if (o.variable) return s
        if (!seenAsset.has(o.asset)) { seenAsset.add(o.asset); return s + o.monthly }
        return s
      }, 0)
    )

    // Current positions — compute what each deposit is earning today, and what
    // the same balance would earn in the best alternative for that asset.
    const bestApyForAsset = (asset: 'USDC' | 'ETH'): { name: string; apy: number } => {
      let best = { name: '', apy: 0 }
      for (const def of PROTOCOL_DEFS) {
        if (def.variable) continue
        const defAsset = def.token === 'ETH' ? 'ETH' : def.token === 'USDC' ? 'USDC' : null
        if (defAsset !== asset) continue
        const apy = apyForDef(def) ?? 0
        if (apy > best.apy) best = { name: def.name, apy }
      }
      return best
    }

    const currentPositions: CurrentPosition[] = []
    for (const p of positions) {
      const def = PROTOCOL_DEFS.find(d => d.id === p.protocolId)
      const apy = def ? (apyForDef(def) ?? 0) : 0
      const usdPer = p.asset === 'ETH' ? ethPrice : 1
      const balanceUsd = safe(p.amount) * usdPer
      const monthly    = (balanceUsd * apy) / 100 / 12
      const best       = bestApyForAsset(p.asset)
      const bestMonthly = (balanceUsd * best.apy) / 100 / 12
      const delta       = Math.max(0, bestMonthly - monthly)

      currentPositions.push({
        protocolId:       p.protocolId,
        protocolName:     p.protocolName,
        asset:            p.asset,
        amount:           safe(p.amount),
        balanceUsd:       round2(balanceUsd),
        apy:              round1(apy),
        monthly:          round2(monthly),
        bestProtocolName: best.name,
        bestApy:          round1(best.apy),
        bestMonthly:      round2(bestMonthly),
        delta:            round2(delta),
      })
    }

    const currentMonthly = round2(currentPositions.reduce((s, p) => s + p.monthly, 0))
    const leftOnTable    = Math.max(0, round2(totalMonthly - currentMonthly))

    // Lifetime missed: for each asset that has been sitting idle (i.e., in the
    // wallet but not in a detected lending position), project what it would
    // have earned at the best APY for that asset since the wallet's earliest
    // inbound transfer of that asset on Base. Deposited balances are assumed
    // to have been earning something; we don't credit their full history as
    // "missed" to stay conservative.
    const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000
    const now = Date.now()
    const bestEthApy  = bestApyForAsset('ETH').apy
    const bestUsdcApy = bestApyForAsset('USDC').apy
    const idleUsdc = safe(balances.USDC)
    const idleEth  = safe(balances.ETH) + safe(balances.WETH)

    // Prefer the later of USDC/WETH/ETH inbound dates per asset family.
    const earliestEth  = [firstInbound.ETH, firstInbound.WETH].filter(Boolean).sort((a, b) => (a!.getTime() - b!.getTime()))[0]
    const earliestUsdc = firstInbound.USDC
    const earliestAny  = [firstInbound.ETH, firstInbound.WETH, firstInbound.USDC]
      .filter((d): d is Date => !!d)
      .sort((a, b) => a.getTime() - b.getTime())[0]

    const yearsEth  = earliestEth  ? Math.max(0, Math.min(20, (now - earliestEth.getTime())  / MS_PER_YEAR)) : 0
    const yearsUsdc = earliestUsdc ? Math.max(0, Math.min(20, (now - earliestUsdc.getTime()) / MS_PER_YEAR)) : 0

    const missedUsdc = idleUsdc         * (bestUsdcApy / 100) * yearsUsdc
    const missedEth  = idleEth * ethPrice * (bestEthApy  / 100) * yearsEth

    const lifetimeMissed = Math.max(0, round2(missedUsdc + missedEth))
    const earliestInboundIso = earliestAny ? earliestAny.toISOString() : undefined

    const MS_PER_DAY = 24 * 60 * 60 * 1000
    const idleDays = earliestAny ? Math.max(0, Math.floor((now - earliestAny.getTime()) / MS_PER_DAY)) : 0

    const idleUsd = usdcIdle + ethIdle * ethPrice + safe(balances.USDbC)
    const archetype = pickArchetype({
      totalUsd: totalPortfolioUsd,
      idleUsd,
      idleDays,
      hasPositions: currentPositions.length > 0,
      hasDelta: currentPositions.some(p => p.delta > 0.01),
    })

    // All protocol rates regardless of user balance, for the calculator
    const allRates: Rate[] = []
    const seenRate = new Set<string>()
    for (const def of PROTOCOL_DEFS) {
      if (seenRate.has(def.id)) continue
      const apy = apyForDef(def)
      if (!apy) continue
      seenRate.add(def.id)
      const existing = allRates.find(r => r.name === def.name)
      if (existing) {
        if (apy > existing.apy) existing.apy = round1(apy)
      } else {
        allRates.push({ id: def.id, name: def.name, logo: def.logo, brand: def.brand, initials: def.initials, asset: def.token === 'ETH' ? 'ETH' : def.token === 'USDC' ? 'USDC' : 'USDbC', apy: round1(apy), variable: def.variable })
      }
    }
    allRates.sort((a, b) => b.apy - a.apy)

    const result: AnalyzeResult = {
      address,
      opportunities,
      totalMonthly,
      currentMonthly,
      leftOnTable,
      lifetimeMissed,
      earliestInboundIso,
      idleDays,
      archetype,
      positions: currentPositions,
      balances: {
        ETH:   safe(balances.ETH),
        USDC:  safe(balances.USDC),
        USDbC: safe(balances.USDbC),
        WETH:  safe(balances.WETH),
      },
      ethPrice: safe(ethPrice),
      allRates,
    }

    return { ok: true, result }
  } catch (err) {
    console.error('[analyze]', err)
    const message = err instanceof Error ? err.message : 'Analysis failed'
    return { ok: false, status: 500, error: message }
  }
}
