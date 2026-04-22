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
}

export interface AnalyzeResult {
  address: string
  opportunities: Opportunity[]
  totalMonthly: number
  balances: {
    ETH: number
    USDC: number
    USDbC: number
    WETH: number
  }
  ethPrice: number
}
