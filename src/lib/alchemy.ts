// Alchemy helpers. Used to find the first inbound transfer of each asset, so
// we can estimate how long a balance has been sitting idle and project a
// cumulative "total missed" figure — far more evocative than $/mo alone.

const API_KEY = process.env.ALCHEMY_API_KEY
const ALCHEMY_BASE = API_KEY
  ? `https://base-mainnet.g.alchemy.com/v2/${API_KEY}`
  : null

const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
const WETH_BASE = '0x4200000000000000000000000000000000000006'

const REQUEST_TIMEOUT_MS = 6000

type Transfer = {
  blockNum: string
  metadata?: { blockTimestamp?: string }
}

async function firstTransfer(
  address: string,
  category: ('external' | 'erc20')[],
  contractAddresses?: string[],
): Promise<Transfer | null> {
  if (!ALCHEMY_BASE) return null
  const body = {
    jsonrpc: '2.0',
    id: 1,
    method: 'alchemy_getAssetTransfers',
    params: [{
      fromBlock: '0x0',
      toBlock: 'latest',
      toAddress: address,
      category,
      withMetadata: true,
      excludeZeroValue: true,
      order: 'asc',
      maxCount: '0x1',
      ...(contractAddresses ? { contractAddresses } : {}),
    }],
  }
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS)
  try {
    const res = await fetch(ALCHEMY_BASE, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    })
    if (!res.ok) return null
    const json = await res.json()
    const t = json?.result?.transfers?.[0]
    return t ?? null
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

export interface FirstInbound {
  ETH?: Date
  USDC?: Date
  WETH?: Date
}

export async function getFirstInbound(address: string): Promise<FirstInbound> {
  const [eth, usdc, weth] = await Promise.all([
    firstTransfer(address, ['external']),
    firstTransfer(address, ['erc20'], [USDC_BASE]),
    firstTransfer(address, ['erc20'], [WETH_BASE]),
  ])

  const out: FirstInbound = {}
  const now = Date.now()
  const toDate = (t: Transfer | null) => {
    const ts = t?.metadata?.blockTimestamp
    if (!ts || typeof ts !== 'string') return undefined
    const d = new Date(ts)
    const n = d.getTime()
    // Reject unparseable, pre-2015 (before Ethereum), or future timestamps.
    if (!Number.isFinite(n) || n < 1_420_000_000_000 || n > now + 60_000) return undefined
    return d
  }
  const e = toDate(eth);  if (e) out.ETH  = e
  const u = toDate(usdc); if (u) out.USDC = u
  const w = toDate(weth); if (w) out.WETH = w
  return out
}
