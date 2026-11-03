import { db } from '@/lib/db'

// Order matters: transactions reference accounts and categories.
export async function resetDb(): Promise<void> {
  await db.transaction.deleteMany()
  await db.category.deleteMany()
  await db.account.deleteMany()
}
