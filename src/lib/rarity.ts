// Archetype rarity — counts how many wallets have received each archetype
// label so we can show "only 3% of wallets are Already Optimized" on the card.
//
// Backed by Upstash Redis (set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN).
// If those env vars are missing, every function is a no-op and rarity is
// simply omitted from the response — the app still works without Redis.

import { Redis } from '@upstash/redis'

const WALLET_TO_ARCHETYPE = 'earny:wa'   // hash: address -> archetypeId
const COUNTS              = 'earny:counts' // hash: archetypeId -> count

let _redis: Redis | null = null
let _probed = false
function redis(): Redis | null {
  if (_probed) return _redis
  _probed = true
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  try {
    _redis = new Redis({ url, token })
  } catch {
    _redis = null
  }
  return _redis
}

// Cache the counts in memory — rarity figures don't need to be realtime and
// reading them on every analyze request would add latency for zero user value.
const COUNTS_TTL_MS = 30_000
let _countsCache: { data: Record<string, number>; ts: number } | null = null
let _countsInflight: Promise<Record<string, number>> | null = null

async function readCounts(): Promise<Record<string, number> | null> {
  const r = redis()
  if (!r) return null
  if (_countsCache && Date.now() - _countsCache.ts < COUNTS_TTL_MS) return _countsCache.data
  if (_countsInflight) return _countsInflight

  _countsInflight = (async () => {
    try {
      const raw = await r.hgetall<Record<string, string | number>>(COUNTS) ?? {}
      const data: Record<string, number> = {}
      for (const [k, v] of Object.entries(raw)) {
        const n = typeof v === 'number' ? v : Number(v)
        if (Number.isFinite(n) && n > 0) data[k] = n
      }
      _countsCache = { data, ts: Date.now() }
      return data
    } catch {
      return _countsCache?.data ?? {}
    } finally {
      _countsInflight = null
    }
  })()
  return _countsInflight
}

export interface Rarity {
  percent: number   // share of the archetype, 0.1..100
  total:   number   // total wallets tracked
  count:   number   // wallets currently tagged this archetype
}

export async function getRarity(archetypeId: string): Promise<Rarity | null> {
  const counts = await readCounts()
  if (!counts) return null
  const total = Object.values(counts).reduce((s, n) => s + n, 0)
  if (total < 10) return null // hide until we have a meaningful sample
  const count = counts[archetypeId] ?? 0
  if (count === 0) return null
  const percent = Math.max(0.1, Math.round((count / total) * 1000) / 10)
  return { percent, total, count }
}

// Fire-and-forget: update the wallet's current archetype and adjust counters
// atomically enough for our purposes. Never throws — if Redis is flaky, we
// skip this write and let the next analysis correct it.
export function recordWallet(address: string, archetypeId: string): void {
  const r = redis()
  if (!r) return
  const addr = address.toLowerCase()
  ;(async () => {
    try {
      const prev = await r.hget<string>(WALLET_TO_ARCHETYPE, addr)
      if (prev === archetypeId) return
      const p = r.pipeline()
      if (prev) p.hincrby(COUNTS, prev, -1)
      p.hincrby(COUNTS, archetypeId, 1)
      p.hset(WALLET_TO_ARCHETYPE, { [addr]: archetypeId })
      await p.exec()
      // Invalidate the in-memory cache so the next read reflects the change.
      _countsCache = null
    } catch {
      // swallow — rarity is a nice-to-have, not critical path
    }
  })()
}
