import type { TransactionType } from '@/generated/prisma/client'
import { db } from '@/lib/db'
import { type Period, periodOf } from './period'

type TypeTotals = {
  type: TransactionType
  _sum: { amountCents: number | null }
}[]

// Sums are done by the database. A missing type means no rows, so it counts as zero.
function splitByType(rows: TypeTotals) {
  const total = (type: TransactionType) =>
    rows.find((row) => row.type === type)?._sum.amountCents ?? 0
  return { incomeCents: total('INCOME'), expenseCents: total('EXPENSE') }
}

const inPeriod = (period: Period) => ({
  date: { gte: period.from, lt: period.to },
})

export async function getTotalBalance(): Promise<number> {
  const [initial, totals] = await Promise.all([
    db.account.aggregate({ _sum: { initialBalanceCents: true } }),
    db.transaction.groupBy({ by: ['type'], _sum: { amountCents: true } }),
  ])
  const { incomeCents, expenseCents } = splitByType(totals)
  return (initial._sum.initialBalanceCents ?? 0) + incomeCents - expenseCents
}

export async function getPeriodSummary(period: Period) {
  const totals = await db.transaction.groupBy({
    by: ['type'],
    where: inPeriod(period),
    _sum: { amountCents: true },
  })
  const { incomeCents, expenseCents } = splitByType(totals)
  return { incomeCents, expenseCents, balanceCents: incomeCents - expenseCents }
}

export async function getExpensesByCategory(period: Period) {
  const groups = await db.transaction.groupBy({
    by: ['categoryId'],
    where: { ...inPeriod(period), type: 'EXPENSE' },
    _sum: { amountCents: true },
    orderBy: { _sum: { amountCents: 'desc' } },
  })
  const categories = await db.category.findMany({
    where: { id: { in: groups.map((group) => group.categoryId) } },
    select: { id: true, name: true, color: true },
  })
  const byId = new Map(categories.map((category) => [category.id, category]))

  return groups.flatMap(({ categoryId, _sum }) => {
    const category = byId.get(categoryId)
    return category
      ? [
          {
            categoryId,
            name: category.name,
            color: category.color,
            totalCents: _sum.amountCents ?? 0,
          },
        ]
      : []
  })
}

// ponytail: one groupBy per month (6 queries in parallel). Upgrade path: one raw
// date_trunc('month') query if the dashboard gets slow.
export async function getMonthlySeries(end: Period, months = 6) {
  const periods = Array.from({ length: months }, (_, i) =>
    periodOf(end.year, end.month - 1 - (months - 1 - i)),
  )
  return Promise.all(
    periods.map(async (period) => {
      const totals = await db.transaction.groupBy({
        by: ['type'],
        where: inPeriod(period),
        _sum: { amountCents: true },
      })
      return {
        label: period.from.toISOString().slice(0, 7),
        ...splitByType(totals),
      }
    }),
  )
}

export function getRecentTransactions(limit = 5) {
  return db.transaction.findMany({
    orderBy: [{ date: 'desc' }, { id: 'desc' }],
    take: limit,
    select: {
      id: true,
      description: true,
      amountCents: true,
      type: true,
      date: true,
      category: { select: { name: true } },
    },
  })
}
