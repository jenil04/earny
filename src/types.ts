export interface Opportunity {
  id: string
  name: string
  tagline: string
  brand: string
  initials: string
  logo: string
  asset: string
  size: string
  action: string
  detail: string
  yieldPct: number
  monthly: number
  trust: number
  steps: string[]
  link: string
  variable?: boolean
}

export interface Rate {
  id: string
  name: string
  logo: string
  brand: string
  initials: string
  asset: string
  apy: number
  variable?: boolean
}

export type CategoryId = 'yield' | 'launch' | 'founder' | 'airdrop'
export type RiskLevel = 'low' | 'medium' | 'high'

export interface CurrentPosition {
  protocolId: string
  protocolName: string
  asset: 'USDC' | 'ETH'
  amount: number        // in underlying (USDC units or ETH units)
  balanceUsd: number
  apy: number           // currently earned APY on that position, % (0 if unknown)
  monthly: number       // USD/mo being earned right now
  bestProtocolName: string   // name of the best alternative for this asset
  bestApy: number
  bestMonthly: number   // USD/mo if moved to the best alternative
  delta: number         // bestMonthly - monthly; >=0
}

export interface Archetype {
  id: string
  label: string
  tagline: string
  shareVerb: string
}

export interface AnalyzeResult {
  address: string
  opportunities: Opportunity[]
  totalMonthly: number          // potential: best protocol per asset using idle + deposited balance
  currentMonthly: number        // USD/mo currently being earned across detected positions
  leftOnTable: number           // max(0, totalMonthly - currentMonthly)
  lifetimeMissed: number        // cumulative USD that idle assets would have earned at best APY since first inbound
  earliestInboundIso?: string   // ISO date of earliest inbound transfer across tracked assets
  idleDays: number              // days since earliest inbound (0 if unknown)
  archetype: Archetype          // shareable label for the wallet
  positions: CurrentPosition[]  // detected lending deposits, with delta per position
  balances: {
    ETH: number
    USDC: number
    USDbC: number
    WETH: number
  }
  ethPrice: number
  allRates: Rate[]
}
