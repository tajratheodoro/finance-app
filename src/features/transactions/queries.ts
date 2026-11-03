import type { Prisma, TransactionType } from '@/generated/prisma/client'
import { db } from '@/lib/db'

const PAGE_SIZE = 20

// Names for the list screen, so each row shows the account and category.
const transactionInclude = {
  account: { select: { name: true } },
  category: { select: { name: true } },
} satisfies Prisma.TransactionInclude

export type TransactionWithNames = Prisma.TransactionGetPayload<{
  include: typeof transactionInclude
}>

export type TransactionFilters = {
  page?: number
  accountId?: string
  categoryId?: string
  type?: TransactionType
  from?: Date
  to?: Date
}

// Dates are stored at noon UTC, so day boundaries are compared in UTC.
function utcDay(date: Date, addDays = 0): Date {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate() + addDays,
    ),
  )
}

export async function listTransactions(
  filters: TransactionFilters = {},
): Promise<{
  items: TransactionWithNames[]
  total: number
  page: number
  pageSize: typeof PAGE_SIZE
}> {
  const page = Math.max(1, filters.page ?? 1)

  const where: Prisma.TransactionWhereInput = {
    accountId: filters.accountId,
    categoryId: filters.categoryId,
    type: filters.type,
  }
  if (filters.from || filters.to) {
    where.date = {
      ...(filters.from && { gte: utcDay(filters.from) }),
      ...(filters.to && { lt: utcDay(filters.to, 1) }),
    }
  }

  // One transaction so the total and the page come from the same snapshot.
  const [total, items] = await db.$transaction([
    db.transaction.count({ where }),
    db.transaction.findMany({
      where,
      orderBy: [{ date: 'desc' }, { id: 'asc' }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: transactionInclude,
    }),
  ])

  return { items, total, page, pageSize: PAGE_SIZE }
}
