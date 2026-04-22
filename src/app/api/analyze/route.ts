import { NextRequest, NextResponse } from 'next/server'
import { isAddress } from 'viem'
import { getBalances } from '@/lib/wallet'
import { getBasePools, getEthPrice, findBestPool } from '@/lib/defi-llama'
import { PROTOCOL_DEFS } from '@/lib/protocols'
import type { Opportunity, AnalyzeResult } from '@/types'

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

    const result: AnalyzeResult = {
      address,
      opportunities,
      totalMonthly: Math.round(opportunities.reduce((s, o) => s + o.monthly, 0) * 100) / 100,
      balances,
      ethPrice,
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error('[analyze]', err)
    const message = err instanceof Error ? err.message : 'Analysis failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
