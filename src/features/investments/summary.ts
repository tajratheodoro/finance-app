import type { InvestmentKind } from '@/generated/prisma/client'

type Row = {
  kind: InvestmentKind
  investedCents: number
  currentValueCents: number
}

export function returnPercent(invested: number, current: number): number {
  return invested > 0 ? ((current - invested) / invested) * 100 : 0
}

export function summarize(rows: Row[]) {
  const investedCents = rows.reduce((s, r) => s + r.investedCents, 0)
  const currentValueCents = rows.reduce((s, r) => s + r.currentValueCents, 0)

  const byKind = new Map<InvestmentKind, number>()
  for (const r of rows) {
    byKind.set(r.kind, (byKind.get(r.kind) ?? 0) + r.currentValueCents)
  }
  const allocation = [...byKind]
    .map(([kind, valueCents]) => ({
      kind,
      valueCents,
      percent:
        currentValueCents > 0 ? (valueCents / currentValueCents) * 100 : 0,
    }))
    .sort((a, b) => b.valueCents - a.valueCents)

  return {
    investedCents,
    currentValueCents,
    returnPercent: returnPercent(investedCents, currentValueCents),
    allocation,
  }
}
