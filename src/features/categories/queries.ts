import { db } from '@/lib/db'

export async function listCategories(type?: 'INCOME' | 'EXPENSE') {
  return db.category.findMany({
    where: { type },
    orderBy: { name: 'asc' },
    include: { _count: { select: { transactions: true } } },
  })
}
