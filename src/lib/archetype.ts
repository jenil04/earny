// Assigns each wallet a shareable archetype. The goal is that *any* wallet —
// tiny or huge, fresh or ancient — gets a label that's fun to share and feels
// specific enough to self-identify with. Order matters: first match wins.

export interface Archetype {
  id: string
  label: string        // shown as the hero stamp
  tagline: string      // one-liner under the stamp
  shareVerb: string    // used when rewriting the tweet text
}

export interface ArchetypeInput {
  totalUsd: number             // portfolio value in USD (idle + deposited)
  idleUsd: number              // USD currently not deployed to any detected position
  idleDays: number             // days since earliest inbound transfer across tracked assets
  hasPositions: boolean        // any Aave/Compound position detected
  hasDelta: boolean            // any detected position is underperforming vs. best alt
}

export function pickArchetype(x: ArchetypeInput): Archetype {
  const idlePct = x.totalUsd > 0 ? x.idleUsd / x.totalUsd : 1

  // Fresh wallets — no shame, just a "you haven't started yet" hook.
  if (x.idleDays > 0 && x.idleDays < 60) {
    return {
      id: 'fresh',
      label: 'Fresh Arrival',
      tagline: 'Just landed on Base. The meter is running.',
      shareVerb: 'just landed on Base',
    }
  }

  // Big portfolio, mostly idle — the biggest dunk.
  if (x.totalUsd >= 50_000 && idlePct >= 0.5) {
    return {
      id: 'dormant-whale',
      label: 'Dormant Whale',
      tagline: 'Six figures on Base. Earning less than a savings account.',
      shareVerb: 'a literal Dormant Whale',
    }
  }

  // Old wallet, almost everything sitting there — the classic "set and forgot".
  if (x.idleDays >= 365 && idlePct >= 0.9) {
    return {
      id: 'sleeper',
      label: 'Sleeper Agent',
      tagline: 'Assets on Base for over a year. Zero jobs done.',
      shareVerb: 'a Sleeper Agent',
    }
  }

  // Medium bag, very idle — not a whale, but still allergic to yield.
  if (x.totalUsd >= 1_000 && idlePct >= 0.8 && x.idleDays >= 180) {
    return {
      id: 'vault-hermit',
      label: 'Vault Hermit',
      tagline: 'Hoarding, not deploying. Your assets miss the sun.',
      shareVerb: 'a Vault Hermit',
    }
  }

  // Has positions but leaving delta on the table.
  if (x.hasPositions && x.hasDelta) {
    return {
      id: 'half-awake',
      label: 'Half-Awake',
      tagline: 'You found yield. You picked the wrong one.',
      shareVerb: 'Half-Awake (earning, but not the best rate)',
    }
  }

  // Has positions at the best rate — rare, and deserves a nod.
  if (x.hasPositions && !x.hasDelta) {
    return {
      id: 'optimized',
      label: 'Already Optimized',
      tagline: 'Rare. Your money actually works a full shift.',
      shareVerb: 'Already Optimized on Base',
    }
  }

  // Default: has money, nothing deployed, nothing dramatic.
  return {
    id: 'couch-capital',
    label: 'Couch Capital',
    tagline: 'Comfy. Idle. Expensive to be.',
    shareVerb: 'Couch Capital (it just sits there)',
  }
}
