import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/lib/db'
import { resetDb } from '../helpers/db'

describe('database schema', () => {
  beforeEach(resetDb)
  afterAll(() => db.$disconnect())

  it('blocks deleting an account that still has transactions', async () => {
    const account = await db.account.create({
      data: { name: 'Nubank', type: 'CHECKING' },
    })
    const category = await db.category.create({
      data: { name: 'Mercado', type: 'EXPENSE', color: '#00ff00' },
    })
    await db.transaction.create({
      data: {
        description: 'Supermercado',
        amountCents: 15000,
        type: 'EXPENSE',
        date: new Date('2026-01-31T12:00:00.000Z'),
        accountId: account.id,
        categoryId: category.id,
      },
    })

    await expect(
      db.account.delete({ where: { id: account.id } }),
    ).rejects.toMatchObject({
      code: 'P2003',
    })
  })
})
