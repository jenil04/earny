export interface LlamaPool {
  pool: string
  chain: string
  project: string
  symbol: string
  tvlUsd: number
  apy: number | null
}

// Module-level cache so repeated API route calls within the same process reuse
// data. Also coalesce concurrent fetches so a burst of requests doesn't trigger
// a thundering herd against DefiLlama.
let _cache: { pools: LlamaPool[]; ts: number } | null = null
let _inflight: Promise<LlamaPool[]> | null = null
const TTL_MS = 15 * 60 * 1000
const STALE_TTL_MS = 6 * 60 * 60 * 1000 // serve stale on upstream failure

let _ethCache: { price: number; ts: number } | null = null
let _ethInflight: Promise<number> | null = null
const ETH_TTL_MS = 5 * 60 * 1000

async function fetchWithTimeout(url: string, ms: number, init?: RequestInit) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), ms)
  try {
    return await fetch(url, { ...init, signal: ctrl.signal })
  } finally {
    clearTimeout(t)
  }
}

export async function getBasePools(): Promise<LlamaPool[]> {
  if (_cache && Date.now() - _cache.ts < TTL_MS) return _cache.pools
  if (_inflight) return _inflight

  _inflight = (async () => {
    try {
      const res = await fetchWithTimeout('https://yields.llama.fi/pools', 8000, { cache: 'no-store' })
      if (!res.ok) throw new Error(`DefiLlama pools ${res.status}`)
      const json = await res.json()
      if (!json || !Array.isArray(json.data)) throw new Error('DefiLlama pools malformed')
      const pools = (json.data as LlamaPool[]).filter(
        p => p && p.chain === 'Base' && typeof p.apy === 'number' && Number.isFinite(p.apy) && (p.apy as number) > 0
      )
      _cache = { pools, ts: Date.now() }
      return pools
    } catch (err) {
      // Serve stale cache if we have one that's not ancient; otherwise rethrow.
      if (_cache && Date.now() - _cache.ts < STALE_TTL_MS) return _cache.pools
      throw err
    } finally {
      _inflight = null
    }
  })()

  return _inflight
}

export async function getEthPrice(): Promise<number> {
  if (_ethCache && Date.now() - _ethCache.ts < ETH_TTL_MS) return _ethCache.price
  if (_ethInflight) return _ethInflight

  _ethInflight = (async () => {
    try {
      const res = await fetchWithTimeout(
        'https://coins.llama.fi/prices/current/coingecko:ethereum',
        5000,
        { next: { revalidate: 300 } }
      )
      if (!res.ok) throw new Error(`eth price ${res.status}`)
      const data = await res.json()
      const price = Number(data?.coins?.['coingecko:ethereum']?.price)
      if (!Number.isFinite(price) || price <= 0 || price > 1_000_000) throw new Error('eth price invalid')
      _ethCache = { price, ts: Date.now() }
      return price
    } catch (err) {
      // Serve stale price if any is available (up to 24h), else rethrow.
      if (_ethCache && Date.now() - _ethCache.ts < 24 * 60 * 60 * 1000) return _ethCache.price
      throw err
    } finally {
      _ethInflight = null
    }
  })()

  return _ethInflight
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
