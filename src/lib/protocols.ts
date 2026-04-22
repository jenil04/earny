export interface ProtocolDef {
  id: string
  name: string
  tagline: string
  brand: string
  initials: string
  logo: string
  detail: string
  trust: number
  link: string
  steps: string[]
  // token the wallet needs to have; 'ETH' means native ETH + WETH combined
  token: 'USDC' | 'USDbC' | 'ETH'
  // DefiLlama matching
  llamaProject: string
  llamaSymbol: string   // fragment matched against pool symbol (uppercase)
  llamaMinTvl: number
  llamaSortBy: 'apy' | 'tvl'
  llamaExclude: string[]  // symbol fragments to exclude
  // fallback APY if DefiLlama has no matching pool
  fallbackApy?: number
}

export const PROTOCOL_DEFS: ProtocolDef[] = [
  // ── USDC ────────────────────────────────────────────────────────────────────
  {
    id: 'compound-usdc',
    name: 'Compound v3',
    tagline: 'Simple, safe lending',
    brand: '#D26CAD',
    initials: 'CO',
    logo: '/logos/compound.png',
    detail: 'Single-asset USDC market on Base. Battle-tested, simple risk profile, and currently one of the highest base rates on the network.',
    trust: 3,
    link: 'https://app.compound.finance',
    steps: ['Open Compound v3 on Base', 'Select the USDC market', 'Supply and start earning'],
    token: 'USDC',
    llamaProject: 'compound-v3',
    llamaSymbol: 'USDC',
    llamaMinTvl: 100_000,
    llamaSortBy: 'apy',
    llamaExclude: [],
  },
  {
    id: 'fluid-usdc',
    name: 'Fluid',
    tagline: 'Next-gen lending + DEX',
    brand: '#5DD4D1',
    initials: 'FL',
    logo: '/logos/fluid.png',
    detail: 'Fluid combines lending and AMM liquidity into unified pools for higher effective yield. Solid audits and growing TVL on Base.',
    trust: 2,
    link: 'https://fluid.instadapp.io',
    steps: ['Open fluid.instadapp.io', 'Pick the USDC lending pool', 'Deposit and earn'],
    token: 'USDC',
    llamaProject: 'fluid-lending',
    llamaSymbol: 'USDC',
    llamaMinTvl: 1_000_000,
    llamaSortBy: 'apy',
    llamaExclude: [],
  },
  {
    id: 'morpho-usdc',
    name: 'Morpho',
    tagline: 'Curated USDC vaults, better rates',
    brand: '#2E6CF6',
    initials: 'MO',
    logo: '/logos/morpho.png',
    detail: 'Morpho curated vaults (Steakhouse, Gauntlet) automatically route your USDC to the highest-yielding underlying market. Billions in TVL.',
    trust: 3,
    link: 'https://app.morpho.org',
    steps: ['Open app.morpho.org on Base', 'Browse curated USDC vaults', 'Deposit — vault rebalances automatically'],
    token: 'USDC',
    llamaProject: 'morpho-v1',
    llamaSymbol: 'USDC',
    llamaMinTvl: 10_000_000,
    llamaSortBy: 'tvl',  // take highest-TVL for stability (all at ~4%)
    llamaExclude: [],
  },
  {
    id: 'aave-usdc',
    name: 'Aave v3',
    tagline: 'The original lending market',
    brand: '#B6509E',
    initials: 'AA',
    logo: '/logos/aave.png',
    detail: 'The largest, most battle-tested lending market in DeFi. Lower APY than Compound but virtually bulletproof security record.',
    trust: 3,
    link: 'https://app.aave.com',
    steps: ['Open Aave on Base', 'Supply USDC', 'Earn — or borrow against it later'],
    token: 'USDC',
    llamaProject: 'aave-v3',
    llamaSymbol: 'USDC',
    llamaMinTvl: 1_000_000,
    llamaSortBy: 'apy',
    llamaExclude: [],
  },
  {
    id: 'moonwell-usdc',
    name: 'Moonwell',
    tagline: 'Base-native lending with WELL rewards',
    brand: '#C07A4B',
    initials: 'MW',
    logo: '/logos/moonwell.png',
    detail: 'Base-native lending market. WELL token rewards supplement the base interest rate, boosting your effective APY.',
    trust: 2,
    link: 'https://moonwell.fi',
    steps: ['Open moonwell.fi on Base', 'Supply USDC', 'Claim WELL rewards weekly'],
    token: 'USDC',
    llamaProject: 'moonwell-lending',
    llamaSymbol: 'USDC',
    llamaMinTvl: 100_000,
    llamaSortBy: 'apy',
    llamaExclude: [],
  },

  // ── ETH / WETH ───────────────────────────────────────────────────────────────
  {
    id: 'morpho-eth',
    name: 'Morpho',
    tagline: 'Curated ETH vaults, peer-matched rates',
    brand: '#2E6CF6',
    initials: 'MO',
    logo: '/logos/morpho.png',
    detail: 'Morpho ETH curated vaults match lenders and borrowers directly, consistently outperforming Aave and Compound on ETH yields.',
    trust: 3,
    link: 'https://app.morpho.org',
    steps: ['Open app.morpho.org on Base', 'Browse ETH / WETH vaults', 'Deposit — interest accrues every block'],
    token: 'ETH',
    llamaProject: 'morpho-v1',
    llamaSymbol: 'ETH',
    llamaMinTvl: 1_000_000,
    llamaSortBy: 'apy',
    // exclude staked variants and cross-collateral symbols containing these
    llamaExclude: ['WSTETH', 'RSETH', 'WEETH', 'CBETH', 'GTMSE', 'MSETH'],
  },
  {
    id: 'fluid-eth',
    name: 'Fluid',
    tagline: 'Native ETH lending on Base',
    brand: '#5DD4D1',
    initials: 'FL',
    logo: '/logos/fluid.png',
    detail: 'Fluid accepts native ETH directly — no wrapping needed. Combined lending + DEX activity lifts effective yield above standard markets.',
    trust: 2,
    link: 'https://fluid.instadapp.io',
    steps: ['Open fluid.instadapp.io', 'Pick the ETH lending pool', 'Deposit native ETH'],
    token: 'ETH',
    llamaProject: 'fluid-lending',
    llamaSymbol: 'ETH',
    llamaMinTvl: 1_000_000,
    llamaSortBy: 'apy',
    llamaExclude: ['WSTETH'],
  },
  {
    id: 'aave-weth',
    name: 'Aave v3',
    tagline: 'ETH lending, bulletproof security',
    brand: '#B6509E',
    initials: 'AA',
    logo: '/logos/aave.png',
    detail: 'Aave v3 WETH market on Base. Wrap your ETH and supply to the most audited lending protocol in DeFi.',
    trust: 3,
    link: 'https://app.aave.com',
    steps: ['Wrap ETH → WETH (one click in Aave UI)', 'Supply WETH on Base', 'Earn variable rate interest'],
    token: 'ETH',
    llamaProject: 'aave-v3',
    llamaSymbol: 'WETH',
    llamaMinTvl: 1_000_000,
    llamaSortBy: 'apy',
    llamaExclude: ['WSTETH', 'RSETH', 'WEETH'],
  },

  // ── USDbC ────────────────────────────────────────────────────────────────────
  {
    id: 'aave-usdbc',
    name: 'Aave v3',
    tagline: 'USDbC supply market',
    brand: '#B6509E',
    initials: 'AA',
    logo: '/logos/aave.png',
    detail: 'Aave v3 still supports USDbC on Base. Low APY reflects reduced demand as the market migrates to native USDC, but it\'s a safe place to park idle USDbC.',
    trust: 3,
    link: 'https://app.aave.com',
    steps: ['Open Aave on Base', 'Supply USDbC', 'Earn variable rate (consider migrating to USDC for better rates)'],
    token: 'USDbC',
    llamaProject: 'aave-v3',
    llamaSymbol: 'USDBC',  // DefiLlama uses USDBC not USDbC
    llamaMinTvl: 0,
    llamaSortBy: 'apy',
    llamaExclude: [],
  },
]
