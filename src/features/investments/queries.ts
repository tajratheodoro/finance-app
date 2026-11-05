import { db } from '@/lib/db'
import { summarize } from './summary'

export function listInvestments() {
  return db.investment.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      kind: true,
      institution: true,
      investedCents: true,
      currentValueCents: true,
    },
  })
}

export async function getInvestmentSummary() {
  return summarize(await listInvestments())
}
