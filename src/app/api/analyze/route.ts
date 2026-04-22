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

    const ethTotal = balances.ETH + balances.WETH
    const totalPortfolioUsd = ethTotal * ethPrice + balances.USDC + balances.USDbC

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
        balanceAmount = balances.USDC
        balanceUsd    = balances.USDC
        assetLabel    = 'USDC'
      } else {
        balanceAmount = balances.USDbC
        balanceUsd    = balances.USDbC
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

      const pool = findBestPool(pools, def.llamaProject, def.llamaSymbol, {
        minTvl:         def.llamaMinTvl,
        sortBy:         def.llamaSortBy,
        excludeSymbols: def.llamaExclude,
      })

      const apy = def.fallbackApy ?? pool?.apy
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
        yieldPct: Math.round(apy * 10) / 10,
        monthly:  Math.round(monthly * 100) / 100,
        trust:    def.trust,
        steps:    def.steps,
        link:     def.link,
        variable: def.variable,
      })
    }

    // Highest monthly earnings first
    opportunities.sort((a, b) => b.monthly - a.monthly)

    // Total = best (highest monthly) opportunity per asset type. Variable-yield
    // protocols (e.g. Ample prize draws) don't contribute a fixed monthly number.
    const seenAsset = new Set<string>()
    const totalMonthly = Math.round(
      opportunities.reduce((s, o) => {
        if (o.variable) return s
        if (!seenAsset.has(o.asset)) { seenAsset.add(o.asset); return s + o.monthly }
        return s
      }, 0) * 100
    ) / 100

    // All protocol rates regardless of user balance, for the calculator
    const allRates: Rate[] = []
    const seenRate = new Set<string>()
    for (const def of PROTOCOL_DEFS) {
      if (seenRate.has(def.id)) continue
      const pool = findBestPool(pools, def.llamaProject, def.llamaSymbol, {
        minTvl: def.llamaMinTvl,
        sortBy: def.llamaSortBy,
        excludeSymbols: def.llamaExclude,
      })
      const apy = def.fallbackApy ?? pool?.apy
      if (!apy) continue
      seenRate.add(def.id)
      const existing = allRates.find(r => r.name === def.name)
      if (existing) {
        if (apy > existing.apy) existing.apy = Math.round(apy * 10) / 10
      } else {
        allRates.push({ id: def.id, name: def.name, logo: def.logo, brand: def.brand, initials: def.initials, asset: def.token === 'ETH' ? 'ETH' : def.token === 'USDC' ? 'USDC' : 'USDbC', apy: Math.round(apy * 10) / 10, variable: def.variable })
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
