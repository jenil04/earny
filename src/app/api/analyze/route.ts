import { NextRequest, NextResponse } from 'next/server'
import { isAddress } from 'viem'
import { getBalances } from '@/lib/wallet'
import { getBasePools, getEthPrice, findBestPool } from '@/lib/defi-llama'
import { PROTOCOL_DEFS } from '@/lib/protocols'
import type { Opportunity, AnalyzeResult, Rate } from '@/types'

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get('address') ?? ''

  if (!isAddress(address)) {
    return NextResponse.json({ error: 'Invalid Ethereum address' }, { status: 400 })
  }

  try {
    const [balances, ethPrice, pools] = await Promise.all([
      getBalances(address),
      getEthPrice(),
      getBasePools(),
    ])

    // Native ETH + WETH are interchangeable for yield purposes
    const ethTotal = balances.ETH + balances.WETH

    const opportunities: Opportunity[] = []

    for (const def of PROTOCOL_DEFS) {
      // Resolve balance and USD value for this protocol's token
      let balanceAmount: number
      let balanceUsd: number
      let assetLabel: string

      if (def.token === 'ETH') {
        balanceAmount = ethTotal
        balanceUsd    = ethTotal * ethPrice
        assetLabel    = 'ETH'
      } else if (def.token === 'USDC') {
        balanceAmount = balances.USDC
        balanceUsd    = balances.USDC
        assetLabel    = 'USDC'
      } else {
        balanceAmount = balances.USDbC
        balanceUsd    = balances.USDbC
        assetLabel    = 'USDbC'
      }

      // Skip tiny balances (< $1)
      if (balanceUsd < 1) continue

      // Find best pool on DefiLlama
      const pool = findBestPool(pools, def.llamaProject, def.llamaSymbol, {
        minTvl:        def.llamaMinTvl,
        sortBy:        def.llamaSortBy,
        excludeSymbols: def.llamaExclude,
      })

      const apy = pool?.apy ?? def.fallbackApy
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
        action:   `Supply ${sizeStr} to ${def.name}`,
        detail:   def.detail,
        yieldPct: Math.round(apy * 10) / 10,
        monthly:  Math.round(monthly * 100) / 100,
        trust:    def.trust,
        steps:    def.steps,
        link:     def.link,
      })
    }

    // Highest monthly earnings first
    opportunities.sort((a, b) => b.monthly - a.monthly)

    // A wallet can only deploy each asset to ONE protocol at a time.
    // Total = best (highest monthly) opportunity per asset type.
    const seenAsset = new Set<string>()
    const totalMonthly = Math.round(
      opportunities.reduce((s, o) => {
        if (!seenAsset.has(o.asset)) { seenAsset.add(o.asset); return s + o.monthly }
        return s
      }, 0) * 100
    ) / 100

    // All protocol rates regardless of user balance — for the calculator
    const allRates: Rate[] = []
    const seenRate = new Set<string>()
    for (const def of PROTOCOL_DEFS) {
      if (seenRate.has(def.id)) continue
      const pool = findBestPool(pools, def.llamaProject, def.llamaSymbol, {
        minTvl: def.llamaMinTvl,
        sortBy: def.llamaSortBy,
        excludeSymbols: def.llamaExclude,
      })
      const apy = pool?.apy ?? def.fallbackApy
      if (!apy) continue
      seenRate.add(def.id)
      // dedupe by name, keep best apy
      const existing = allRates.find(r => r.name === def.name)
      if (existing) {
        if (apy > existing.apy) existing.apy = Math.round(apy * 10) / 10
      } else {
        allRates.push({ id: def.id, name: def.name, logo: def.logo, brand: def.brand, initials: def.initials, asset: def.token === 'ETH' ? 'ETH' : def.token === 'USDC' ? 'USDC' : 'USDbC', apy: Math.round(apy * 10) / 10 })
      }
    }
    allRates.sort((a, b) => b.apy - a.apy)

    const result: AnalyzeResult = {
      address,
      opportunities,
      totalMonthly,
      balances,
      ethPrice,
      allRates,
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error('[analyze]', err)
    const message = err instanceof Error ? err.message : 'Analysis failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
