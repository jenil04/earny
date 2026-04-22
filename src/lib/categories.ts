import type { CategoryId, RiskLevel } from '@/types'

export interface CategoryMeta {
  id: CategoryId
  name: string       // fun name used in UI
  short: string      // short label for tabs
  risk: RiskLevel
  blurb: string
  sources: { label: string; url?: string }[]   // every data point must cite
  risks: string[]                              // ordered by severity
}

export const CATEGORIES: CategoryMeta[] = [
  {
    id: 'yield',
    name: 'Yield',
    short: 'Yield',
    risk: 'low',
    blurb: 'Park your idle assets in the best lending and aggregator vaults on Base.',
    sources: [
      { label: 'DefiLlama Yields API — live pool APYs', url: 'https://yields.llama.fi/pools' },
      { label: 'Protocol docs (Compound, Aave, Morpho, Fluid, Moonwell, Ample, Arma)' },
    ],
    risks: [
      'Smart-contract risk: a bug in the lending contract or vault can lose all deposited funds.',
      'Oracle / price-feed manipulation can trigger bad liquidations or drain vaults.',
      'Stablecoin depeg (USDC, USDbC): a depeg event can wipe out principal even without a hack.',
      'APY is variable and is not a guarantee; rates can fall to near zero.',
      'Withdrawal queuing or pauses can prevent you from exiting immediately.',
      'Tax treatment of yield is your responsibility and varies by jurisdiction.',
    ],
  },
  {
    id: 'launch',
    name: 'Token Launch',
    short: 'Token launch',
    risk: 'high',
    blurb: 'Launch a token for your app on Tokens. Creator fees accrue with every trade, as long as people keep trading.',
    sources: [
      { label: 'Clanker onchain creator-fee stats (Dune query 4931471)', url: 'https://dune.com/queries/4931471/8160866' },
      { label: 'Tokens.fun — creator fee model', url: 'https://tokens.fun' },
    ],
    risks: [
      'Securities law: depending on structure and marketing, tokens can be classified as unregistered securities in many jurisdictions. Consult a lawyer.',
      'Tax liability: creator fees are typically taxed as income on receipt, then again on disposal. Track everything.',
      'Most launches earn near zero. The median Clanker/Tokens launch never recoups gas + time.',
      'Reputation risk: a failed or exit-liquidity-style launch can damage your personal/founder brand.',
      'Sybil / wash-trading exposure: artificial volume can be detected and lead to exchange delistings.',
      'Smart-contract and liquidity risks on the launchpad contracts themselves.',
    ],
  },
  {
    id: 'founder',
    name: 'Founder Revenue',
    short: 'Founder',
    risk: 'high',
    blurb: 'Ship a product with a token or fee model. Revenue is heavy-tailed: most founders earn near zero, a few earn a lot. These are conservative medians, not averages.',
    sources: [
      { label: 'DefiLlama Fees/Revenue API — Base chain', url: 'https://api.llama.fi/overview/fees/base' },
      { label: 'a16z crypto programs', url: 'https://a16zcrypto.com/crypto-startup-accelerator/' },
      { label: 'Base Ecosystem Fund intake', url: 'https://docs.google.com/forms/d/e/1FAIpQLSeiSAod4PAbXlvvDGtHWu-GqzGpvHYfaTQR2f77AawD7GYc4Q/viewform' },
    ],
    risks: [
      'Legal and regulatory exposure: operating a money-routing protocol can trigger MTL, BSA, or securities obligations depending on jurisdiction.',
      'Personal liability: protocol design decisions may pierce corporate veils for founders in some cases.',
      'Tax / cap-table: token launches, SAFT/SAFE warrants, and VC funding rounds all have complex tax and equity implications.',
      'Fund loss from operational mistakes: private-key loss, bricked upgrades, mis-set fees.',
      'Platform risk: relying on a single chain, oracle, or sequencer means their downtime is your downtime.',
      'Revenue is back-loaded and highly variable. Expect 12–24 months before meaningful monthly revenue.',
    ],
  },
  {
    id: 'airdrop',
    name: 'Airdrops',
    short: 'Airdrops',
    risk: 'medium',
    blurb: 'Stay active across Base dapps. Most months pay nothing; occasional large airdrops drive the averages. Estimates are conservative.',
    sources: [
      { label: 'DefiLlama Airdrops dataset', url: 'https://defillama.com/airdrops' },
      { label: 'Layer3.xyz — quest rewards platform', url: 'https://layer3.xyz' },
    ],
    risks: [
      'Taxation: airdropped tokens are generally treated as ordinary income at fair market value on receipt, then again on disposal.',
      'Sybil detection: using multiple wallets against terms of service can result in disqualification and permanent wallet blacklisting.',
      'Gas cost can exceed payout — many farmers net negative once fees are counted.',
      'Phishing and approval-drain scams are concentrated around quest and airdrop sites.',
      'Past performance is not a forecast. A project may never airdrop, or may exclude your wallet.',
      'Opportunity cost: time spent farming may beat your best alternative use of time.',
    ],
  },
]

export const RISK_STYLE: Record<RiskLevel, { label: string; bg: string; fg: string }> = {
  low:    { label: 'LOW RISK',    bg: 'rgba(16,185,129,0.12)',  fg: '#10B981' },
  medium: { label: 'MEDIUM RISK', bg: 'rgba(245,158,11,0.14)',  fg: '#F59E0B' },
  high:   { label: 'HIGH RISK',   bg: 'rgba(239,68,68,0.14)',   fg: '#EF4444' },
}

// ── Token Launch estimator ───────────────────────────────────────────────────
export const AUDIENCE_TIERS = [
  { id: 'nano',  label: 'Under 500 followers',    monthly: 30 },
  { id: 'small', label: '500 – 5k followers',     monthly: 150 },
  { id: 'mid',   label: '5k – 25k followers',     monthly: 800 },
  { id: 'large', label: '25k – 100k followers',   monthly: 3500 },
  { id: 'whale', label: '100k+ followers',        monthly: 12000 },
] as const

export const LAUNCH_TYPES = [
  { id: 'memecoin', label: 'Memecoin',              mult: 1.0 },
  { id: 'utility',  label: 'Utility / governance',  mult: 0.6 },
  { id: 'product',  label: 'Product-backed token',  mult: 2.2 },
] as const

export function estimateLaunch(audience: string, type: string, priorLaunch: boolean): number {
  const a = AUDIENCE_TIERS.find(t => t.id === audience)?.monthly ?? 0
  const t = LAUNCH_TYPES.find(t => t.id === type)?.mult ?? 1
  const boost = priorLaunch ? 1.4 : 1
  return Math.round(a * t * boost)
}

// ── Founder Revenue estimator ────────────────────────────────────────────────
// Median monthly protocol revenue for a category, at full product-market fit
// (stage mult = 1). Revenue distribution is extremely heavy-tailed: most
// projects earn near zero while a handful capture almost all fees. These are
// conservative medians, not averages.
export const FOUNDER_CATEGORIES = [
  { id: 'dex',     label: 'DEX / AMM',           monthly: 400 },
  { id: 'lending', label: 'Lending / borrow',    monthly: 600 },
  { id: 'perps',   label: 'Perps / derivatives', monthly: 900 },
  { id: 'infra',   label: 'Infra / tooling',     monthly: 150 },
  { id: 'social',  label: 'Social / consumer',   monthly: 120 },
  { id: 'game',    label: 'Game / NFT',          monthly: 80 },
  { id: 'other',   label: 'Other',               monthly: 100 },
] as const

export const FOUNDER_STAGES = [
  { id: 'idea', label: 'Still an idea',              mult: 0 },
  { id: 'mvp',  label: 'MVP in testing',             mult: 0.05 },
  { id: 'live', label: 'Live with users',            mult: 0.4 },
  { id: 'scale',label: 'Scaling / product-market fit', mult: 1.0 },
] as const

// Funding stage is informational; we do not apply a revenue multiplier because
// there is no public dataset linking funding stage to monthly protocol revenue.
export const FOUNDER_FUNDING = [
  { id: 'bootstrapped', label: 'Bootstrapped' },
  { id: 'preseed',      label: 'Pre-seed' },
  { id: 'seed',         label: 'Seed' },
  { id: 'seriesA',      label: 'Series A+' },
] as const

export function estimateFounder(category: string, stage: string): number {
  const c = FOUNDER_CATEGORIES.find(x => x.id === category)?.monthly ?? 0
  const s = FOUNDER_STAGES.find(x => x.id === stage)?.mult ?? 0
  return Math.round(c * s)
}

// ── Airdrop estimator ────────────────────────────────────────────────────────
// Conservative medians. Most farmers net zero in any given month; a handful of
// large airdrops per year create the headline payouts. These figures already
// account for quiet months.
export const AIRDROP_TIERS = [
  { id: 'casual',   label: 'Casual, 1 wallet, weekly activity',   monthly: 10 },
  { id: 'active',   label: 'Active, 2 to 3 wallets, daily',       monthly: 45 },
  { id: 'hardcore', label: 'Hardcore, 5+ wallets, scripted',      monthly: 180 },
] as const

export function estimateAirdrop(tier: string): number {
  return AIRDROP_TIERS.find(t => t.id === tier)?.monthly ?? 0
}

// ── Tools per category ───────────────────────────────────────────────────────
// Concrete platforms users can open to actually do the earning. Mirrors the
// role that lending protocols play for the Yield category.
export interface ToolDef {
  id: string
  name: string
  tagline: string
  brand: string
  initials: string
  logo?: string
  detail: string
  steps: string[]
  link: string
  primary?: boolean  // highlights the first-class recommendation
}

export const TOOLS_BY_CATEGORY: Record<Exclude<CategoryId, 'yield'>, ToolDef[]> = {
  launch: [
    {
      id: 'tokens',
      name: 'Tokens',
      tagline: 'Launch a token for your app.',
      brand: '#D9F574',
      initials: 'TK',
      logo: '/tokens-icon.svg',
      detail: 'Tokens.fun lets you deploy an ERC-20 on Base and start earning creator fees from every trade. Built for fast, social-native launches.',
      steps: [
        'Open tokens.fun',
        'Connect your wallet on Base',
        'Fill in ticker, name, and image',
        'Deploy, share the link, collect creator fees from trades',
      ],
      link: 'https://tokens.fun',
      primary: true,
    },
  ],
  airdrop: [
    {
      id: 'layer3',
      name: 'Layer3',
      tagline: 'Quests across Base apps with real rewards',
      brand: '#D0FF18',
      initials: 'L3',
      logo: '/layer3-icon.svg',
      detail: 'Layer3 aggregates onchain quests from Base ecosystem projects. Completing quests earns points, NFTs, and token allocations that often convert to airdrops.',
      steps: [
        'Open layer3.xyz',
        'Connect your wallet and pick the Base chain filter',
        'Complete quests (swap, bridge, mint, hold)',
        'Claim points and eligible rewards as they unlock',
      ],
      link: 'https://layer3.xyz',
      primary: true,
    },
  ],
  founder: [
    {
      id: 'a16z-csx',
      name: 'a16z crypto CSX',
      tagline: 'a16z Crypto Startup Accelerator (incl. Speedrun)',
      brand: '#000000',
      initials: 'A16',
      logo: '/a16z-icon.svg',
      detail: 'a16z crypto runs an accelerator (CSX) and shorter-form programs like Speedrun for early-stage crypto founders. Funding, mentorship, and distribution.',
      steps: [
        'Read the program overview on a16zcrypto.com',
        'Prepare a one-pager: problem, team, traction',
        'Apply through the program page when applications open',
        'If selected, you get capital + hands-on support',
      ],
      link: 'https://a16zcrypto.com/crypto-startup-accelerator/',
      primary: true,
    },
    {
      id: 'base-ecosystem-fund',
      name: 'Base Ecosystem Fund',
      tagline: 'Coinbase Ventures x Base investments',
      brand: '#0052FF',
      initials: 'BE',
      logo: '/base-logo.svg',
      detail: 'Base Ecosystem Fund backs startups building on Base. Apply with a short intake form — strong founders building onchain products.',
      steps: [
        'Open the intake form',
        'Complete it with project details, traction, and team',
        'Base / Coinbase Ventures reviews and follows up',
      ],
      link: 'https://docs.google.com/forms/d/e/1FAIpQLSeiSAod4PAbXlvvDGtHWu-GqzGpvHYfaTQR2f77AawD7GYc4Q/viewform',
    },
    {
      id: 'base-builder-grants',
      name: 'Base Builder Grants',
      tagline: 'Retroactive grants for builders shipping on Base',
      brand: '#0052FF',
      initials: 'BG',
      logo: '/base-logo.svg',
      detail: 'Base offers retroactive builder grants to teams and solo devs shipping useful things on Base. Apply by sharing what you built.',
      steps: [
        'Open the Base Grants hub',
        'Share what you shipped (repo, demo, onchain activity)',
        'Base reviews retroactively and pays out in ETH',
      ],
      link: 'https://paragraph.com/@grants.base.eth',
    },
  ],
}
