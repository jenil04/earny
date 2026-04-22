export interface LlamaPool {
  pool: string
  chain: string
  project: string
  symbol: string
  tvlUsd: number
  apy: number | null
}

// Module-level cache so repeated API route calls within the same process reuse data
let _cache: { pools: LlamaPool[]; ts: number } | null = null
const TTL_MS = 15 * 60 * 1000

export async function getBasePools(): Promise<LlamaPool[]> {
  if (_cache && Date.now() - _cache.ts < TTL_MS) return _cache.pools

  const res = await fetch('https://yields.llama.fi/pools', { cache: 'no-store' })
  if (!res.ok) throw new Error('DefiLlama fetch failed')

  const json = await res.json()
  const pools = (json.data as LlamaPool[]).filter(
    p => p.chain === 'Base' && typeof p.apy === 'number' && (p.apy as number) > 0
  )
  _cache = { pools, ts: Date.now() }
  return pools
}

export async function getEthPrice(): Promise<number> {
  try {
    const res = await fetch(
      'https://coins.llama.fi/prices/current/coingecko:ethereum',
      { next: { revalidate: 300 } }
    )
    const data = await res.json()
    return (data.coins['coingecko:ethereum']?.price as number) ?? 2500
  } catch {
    return 2500
  }
}

export function findBestPool(
  pools: LlamaPool[],
  project: string,
  symbolContains: string,
  opts: { minTvl?: number; sortBy?: 'tvl' | 'apy'; excludeSymbols?: string[] } = {}
): LlamaPool | null {
  const { minTvl = 100_000, sortBy = 'apy', excludeSymbols = [] } = opts

  const candidates = pools.filter(p =>
    p.project === project &&
    p.symbol.toUpperCase().includes(symbolContains.toUpperCase()) &&
    (p.apy ?? 0) > 0 &&
    (p.tvlUsd ?? 0) >= minTvl &&
    !excludeSymbols.some(ex => p.symbol.toUpperCase().includes(ex.toUpperCase()))
  )

  if (!candidates.length) return null

  candidates.sort((a, b) =>
    sortBy === 'tvl'
      ? (b.tvlUsd ?? 0) - (a.tvlUsd ?? 0)
      : (b.apy ?? 0) - (a.apy ?? 0)
  )
  return candidates[0]
}
