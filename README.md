<div align="center">

# Earny

**Your onchain CFO. Paste a Base wallet, see every way to earn — matched to your assets, in seconds.**

[earny.chat](https://earny.chat) · read-only · no connect · no keys

</div>

---

## What it does

Drop an Ethereum address and Earny reads public onchain state on Base to tell you:

- **How much you *could* be earning** each month on idle USDC, ETH, and WETH across Aave, Compound, Morpho, Fluid, Moonwell, Ample, and Arma.
- **What you're already earning** — it detects your Aave v3 and Compound v3 deposits, compares each position's APY against the best alternative, and shows the delta.
- **Lifetime missed** — cumulative USD your idle assets would have earned since your first inbound transfer on Base, using live best-APY for each asset.
- **Your wallet archetype** — a shareable label (Sleeper Agent, Dormant Whale, Vault Hermit, Half-Awake, Couch Capital…) derived from portfolio size, idle %, and time on Base.

No wallet connection. No signing. Just a GET request.

## Tech

- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript**
- **viem** for Base RPC reads (multicall + JSON-RPC batching)
- **Alchemy** `alchemy_getAssetTransfers` for historical first-inbound lookups
- **DefiLlama** `/pools` for live APYs across ~all Base protocols
- **html-to-image** for client-side share-card capture; `next/og` for crawler OG images
- **Tailwind v4** (minimal — most UI is inline styles for tight visual control)

## Run locally

```bash
git clone git@github.com:jenil04/earny.git
cd earny
npm install
cp .env.local.example .env.local   # then edit it (see below)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

| Var | Required | Get one from |
|---|---|---|
| `ALCHEMY_API_KEY` | Yes | [alchemy.com](https://alchemy.com) — free tier is plenty |
| `BASE_RPC_URL` | Recommended | Same Alchemy key: `https://base-mainnet.g.alchemy.com/v2/<KEY>` — falls back to `mainnet.base.org` if omitted, but that's rate-limited |

Without `ALCHEMY_API_KEY`, the lifetime-missed and archetype features degrade (they still render, but without history-based signals).

## Project layout

```
src/
├── app/
│   ├── api/analyze/route.ts   # the one endpoint that does everything
│   ├── api/og/route.tsx       # dynamic OG image for social
│   ├── layout.tsx             # metadata + base:app_id
│   └── page.tsx               # landing, analyzing, results, share overlay
├── lib/
│   ├── wallet.ts              # native + ERC20 balances via viem
│   ├── positions.ts           # Aave v3 / Compound v3 receipt-token reads
│   ├── defi-llama.ts          # pools + ETH price, with coalescing + stale-on-error
│   ├── alchemy.ts             # first-inbound transfer lookups
│   ├── protocols.ts           # the protocol list (id, symbol, APY matcher, steps)
│   ├── archetype.ts           # wallet-archetype rules
│   ├── categories.ts          # Yield / Airdrop / Launch / Founder panel
│   ├── rate-limit.ts          # in-memory per-IP token bucket
│   └── client.ts              # viem publicClient (multicall + batching)
└── types.ts                   # shared API types
```

## How scoring works

**Potential monthly** = best APY per asset × total balance (idle + deposited) / 12. One opportunity per asset counts toward the headline number — no double-counting across protocols.

**Current monthly** = sum of per-position (APY × balance / 12) for detected Aave/Compound deposits.

**Lifetime missed** = idle USDC × best USDC APY × (years since first USDC inbound) + same for ETH/WETH. Capped at 20 years, conservative on deposited balance (we don't count its full history).

**Archetype** picks the first match from rules in `src/lib/archetype.ts` — tweak freely.

## Adding a new protocol

1. Add its DefiLlama `project` slug and symbol matcher to `src/lib/protocols.ts`.
2. If you want position detection, add the receipt token (aToken / cToken / etc.) to `POSITION_TOKENS` in `src/lib/positions.ts`.
3. Drop a logo SVG into `public/`.

That's it. The rest (opportunity card, rates table, delta calc) wires itself.

## Deployment

Deploy to Vercel with one click — make sure both env vars are set under **Project Settings → Environment Variables** before the first build, or redeploy after adding them.

Rate-limit is in-memory so it's per serverless instance; for serious traffic, front it with Upstash / Vercel KV.

## Disclaimer

For informational purposes only. Not financial, legal, or tax advice. APYs and earnings estimates are variable, sourced from third parties, and can change or be inaccurate at any time. Do your own research.

## License

MIT
