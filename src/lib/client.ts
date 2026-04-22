import { createPublicClient, http } from 'viem'
import { base } from 'viem/chains'

export const publicClient = createPublicClient({
  chain: base,
  transport: http(process.env.BASE_RPC_URL ?? 'https://mainnet.base.org', {
    // Batch multiple reads into a single JSON-RPC request so one analyze call
    // doesn't trigger the public RPC rate limiter.
    batch: { batchSize: 20, wait: 10 },
  }),
  batch: { multicall: true },
})
