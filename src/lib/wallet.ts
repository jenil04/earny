import { erc20Abi, formatUnits, isAddress } from 'viem'
import { publicClient } from './client'

const ERC20_TOKENS = [
  { symbol: 'USDC',  address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const, decimals: 6 },
  { symbol: 'USDbC', address: '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA' as const, decimals: 6 },
  { symbol: 'WETH',  address: '0x4200000000000000000000000000000000000006' as const, decimals: 18 },
] as const

export type Balances = { ETH: number; USDC: number; USDbC: number; WETH: number }

export async function getBalances(address: string): Promise<Balances> {
  if (!isAddress(address)) throw new Error('Invalid address')
  const addr = address as `0x${string}`

  const [ethBal, ...tokenBals] = await Promise.all([
    publicClient.getBalance({ address: addr }),
    ...ERC20_TOKENS.map(t =>
      publicClient.readContract({
        address: t.address,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [addr],
      })
    ),
  ])

  return {
    ETH:   parseFloat(formatUnits(ethBal, 18)),
    USDC:  parseFloat(formatUnits(tokenBals[0] as bigint, 6)),
    USDbC: parseFloat(formatUnits(tokenBals[1] as bigint, 6)),
    WETH:  parseFloat(formatUnits(tokenBals[2] as bigint, 18)),
  }
}
