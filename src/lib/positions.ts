import { erc20Abi, formatUnits } from 'viem'
import { publicClient } from './client'

// Receipt tokens on Base. aTokens (Aave v3) rebase 1:1 with underlying; the
// Compound v3 market contract's balanceOf returns underlying units directly.
// Both make conversion to USD trivial without needing an exchange-rate call.
type PositionToken = {
  protocolId: string            // matches ProtocolDef.id
  protocolName: string
  asset: 'USDC' | 'ETH'
  address: `0x${string}`
  decimals: number
}

const POSITION_TOKENS: PositionToken[] = [
  // Aave v3 Base aTokens
  { protocolId: 'aave-usdc', protocolName: 'Aave v3',   asset: 'USDC', address: '0x4e65fE4DbA92790696d040ac24Aa414708F5c0AB', decimals: 6  },
  { protocolId: 'aave-weth', protocolName: 'Aave v3',   asset: 'ETH',  address: '0xD4a0e0b9149BCee3C920d2E00b5dE09138fd8bb7', decimals: 18 },
  // Compound v3 Base markets (balanceOf = underlying)
  { protocolId: 'compound-usdc', protocolName: 'Compound v3', asset: 'USDC', address: '0xb125E6687d4313864e53df431d5425969c15Eb2F', decimals: 6  },
  { protocolId: 'compound-weth', protocolName: 'Compound v3', asset: 'ETH',  address: '0x46e6b214b524310239732D51387075E0e70970bf', decimals: 18 },
]

export interface Position {
  protocolId: string
  protocolName: string
  asset: 'USDC' | 'ETH'
  amount: number
}

export async function getPositions(address: `0x${string}`): Promise<Position[]> {
  const raw = await Promise.all(
    POSITION_TOKENS.map(t =>
      publicClient
        .readContract({ address: t.address, abi: erc20Abi, functionName: 'balanceOf', args: [address] })
        .catch(() => BigInt(0))
    )
  )

  const positions: Position[] = []
  for (let i = 0; i < POSITION_TOKENS.length; i++) {
    const t = POSITION_TOKENS[i]
    const amount = parseFloat(formatUnits(raw[i] as bigint, t.decimals))
    if (amount < 0.000001) continue
    positions.push({ protocolId: t.protocolId, protocolName: t.protocolName, asset: t.asset, amount })
  }
  return positions
}
