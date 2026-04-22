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
  // if true, always include in results even if user has no matching balance (uses total portfolio USD)
  alwaysShow?: boolean
  // DefiLlama matching
  llamaProject: string
  llamaSymbol: string   // fragment matched against pool symbol (uppercase)
  llamaMinTvl: number
  llamaSortBy: 'apy' | 'tvl'
  llamaExclude: string[]  // symbol fragments to exclude
  // fallback APY if DefiLlama has no matching pool
  fallbackApy?: number
  // if true, render APY as "Variable" instead of a fixed number (monthly still uses fallbackApy)
  variable?: boolean
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
    fallbackApy: 5.2,
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
    fallbackApy: 8.9,
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
    steps: ['Open app.morpho.org on Base', 'Browse curated USDC vaults', 'Deposit, vault rebalances automatically'],
    token: 'USDC',
    llamaProject: 'morpho-v1',
    llamaSymbol: 'USDC',
    llamaMinTvl: 10_000_000,
    llamaSortBy: 'tvl',
    llamaExclude: [],
    fallbackApy: 7.8,
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
    steps: ['Open Aave on Base', 'Supply USDC', 'Earn, or borrow against it later'],
    token: 'USDC',
    llamaProject: 'aave-v3',
    llamaSymbol: 'USDC',
    llamaMinTvl: 1_000_000,
    llamaSortBy: 'apy',
    llamaExclude: [],
    fallbackApy: 4.3,
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
    fallbackApy: 6.1,
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
    steps: ['Open app.morpho.org on Base', 'Browse ETH / WETH vaults', 'Deposit, interest accrues every block'],
    token: 'ETH',
    llamaProject: 'morpho-v1',
    llamaSymbol: 'ETH',
    llamaMinTvl: 1_000_000,
    llamaSortBy: 'apy',
    llamaExclude: ['WSTETH', 'RSETH', 'WEETH', 'CBETH', 'GTMSE', 'MSETH'],
    fallbackApy: 3.4,
  },
  {
    id: 'fluid-eth',
    name: 'Fluid',
    tagline: 'Native ETH lending on Base',
    brand: '#5DD4D1',
    initials: 'FL',
    logo: '/logos/fluid.png',
    detail: 'Fluid accepts native ETH directly, no wrapping needed. Combined lending + DEX activity lifts effective yield above standard markets.',
    trust: 2,
    link: 'https://fluid.instadapp.io',
    steps: ['Open fluid.instadapp.io', 'Pick the ETH lending pool', 'Deposit native ETH'],
    token: 'ETH',
    llamaProject: 'fluid-lending',
    llamaSymbol: 'ETH',
    llamaMinTvl: 1_000_000,
    llamaSortBy: 'apy',
    llamaExclude: ['WSTETH'],
    fallbackApy: 3.6,
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
    fallbackApy: 2.5,
  },

  // ── Ample ────────────────────────────────────────────────────────────────────
  {
    id: 'ample-usdc',
    name: 'Ample',
    tagline: 'Variable yield + prize draws on Base',
    brand: '#199B61',
    initials: 'AM',
    logo: '/ample.svg',
    detail: 'Ample routes your USDC through multiple yield strategies (currently Euler and Morpho) to maximise returns, then distributes the pooled yield as weekly prize draws. Your principal is always safe and withdrawable. You swap a steady APY for a chance at a bigger payout.',
    trust: 3,
    link: 'https://ample.money',
    steps: ['Open ample.money', 'Connect your wallet on Base', 'Deposit USDC, withdraw anytime, no lockups'],
    token: 'USDC',
    alwaysShow: true,
    llamaProject: 'ample',
    llamaSymbol: 'USDC',
    llamaMinTvl: 0,
    llamaSortBy: 'apy',
    llamaExclude: [],
    fallbackApy: 10.5,
    variable: true,
  },

  // ── Arma ────────────────────────────────────────────────────────────────────
  {
    id: 'arma-usdc',
    name: 'Arma',
    tagline: 'Multi-strategy USDC yield on Base',
    brand: '#E85D04',
    initials: 'AR',
    logo: '/arma.svg',
    detail: 'Arma aggregates across multiple yield protocols on Base to maximise your USDC return, automatically routing capital to wherever rates are highest. New entrant with competitive yields and a capital-efficient design.',
    trust: 2,
    link: 'https://arma.xyz',
    steps: ['Open arma.xyz', 'Connect your wallet on Base', 'Supply USDC, Arma routes to the best rate'],
    token: 'USDC',
    alwaysShow: true,
    llamaProject: 'arma',
    llamaSymbol: 'USDC',
    llamaMinTvl: 0,
    llamaSortBy: 'apy',
    llamaExclude: [],
    fallbackApy: 15,
  },
]
