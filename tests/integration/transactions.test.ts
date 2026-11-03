import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '@/lib/db'
import {
  createTransaction,
  deleteTransaction,
  updateTransaction,
} from '@/features/transactions/actions'
import { listTransactions } from '@/features/transactions/queries'
import { resetDb } from '../helpers/db'

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

async function fixtures() {
  const account = await db.account.create({
    data: { name: 'Nubank', type: 'CHECKING' },
  })
  const income = await db.category.create({
    data: { name: 'Salário', type: 'INCOME', color: '#00ff00' },
  })
  const expense = await db.category.create({
    data: { name: 'Mercado', type: 'EXPENSE', color: '#ff0000' },
  })
  return { accountId: account.id, incomeId: income.id, expenseId: expense.id }
}

function input(overrides: Partial<Record<string, string>> = {}) {
  return {
    description: 'Supermercado',
    amount: '12,50',
    type: 'EXPENSE',
    date: '2026-01-31',
    ...overrides,
  }
}

describe('transaction actions', () => {
  beforeEach(resetDb)
  afterAll(() => db.$disconnect())

  it('rejects a category whose type differs from the transaction type', async () => {
    const { accountId, expenseId, incomeId } = await fixtures()

    const income = await createTransaction({
      ...input({ type: 'INCOME' }),
      accountId,
      categoryId: expenseId,
    })
    expect(income).toMatchObject({
      ok: false,
      fieldErrors: { categoryId: ['Escolha uma categoria de receita.'] },
    })

    const expense = await createTransaction({
      ...input(),
      accountId,
      categoryId: incomeId,
    })
    expect(expense).toMatchObject({
      ok: false,
      fieldErrors: { categoryId: ['Escolha uma categoria de despesa.'] },
    })

    expect(await db.transaction.count()).toBe(0)
  })

  it('creates a valid transaction', async () => {
    const { accountId, expenseId } = await fixtures()

    const result = await createTransaction({
      ...input(),
      accountId,
      categoryId: expenseId,
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    const row = await db.transaction.findUniqueOrThrow({
      where: { id: result.data!.id },
    })
    expect(row).toMatchObject({ amountCents: 1250, type: 'EXPENSE' })
  })

  it('returns "não encontrada" when updating or deleting an unknown id', async () => {
    const { accountId, expenseId } = await fixtures()
    const valid = { ...input(), accountId, categoryId: expenseId }

    await expect(updateTransaction('missing-id', valid)).resolves.toMatchObject(
      {
        ok: false,
        error: 'Transação não encontrada.',
      },
    )
    await expect(deleteTransaction('missing-id')).resolves.toMatchObject({
      ok: false,
      error: 'Transação não encontrada.',
    })
  })
})

describe('listTransactions', () => {
  beforeEach(resetDb)
  afterAll(() => db.$disconnect())

  it('paginates 20 per page with the total across all pages', async () => {
    const { accountId, expenseId } = await fixtures()
    await db.transaction.createMany({
      data: Array.from({ length: 25 }, (_, i) => ({
        description: `Compra ${i}`,
        amountCents: 100,
        type: 'EXPENSE' as const,
        date: new Date(Date.UTC(2026, 0, 1 + i, 12)),
        accountId,
        categoryId: expenseId,
      })),
    })

    const first = await listTransactions({ page: 1 })
    expect(first).toMatchObject({ total: 25, page: 1, pageSize: 20 })
    expect(first.items).toHaveLength(20)

    const second = await listTransactions({ page: 2 })
    expect(second.total).toBe(25)
    expect(second.items).toHaveLength(5)
  })

  it('filters by type', async () => {
    const { accountId, expenseId, incomeId } = await fixtures()
    await db.transaction.createMany({
      data: [
        {
          description: 'Salário',
          amountCents: 500000,
          type: 'INCOME',
          date: new Date('2026-01-05T12:00:00.000Z'),
          accountId,
          categoryId: incomeId,
        },
        {
          description: 'Almoço',
          amountCents: 3000,
          type: 'EXPENSE',
          date: new Date('2026-01-06T12:00:00.000Z'),
          accountId,
          categoryId: expenseId,
        },
      ],
    })

    const result = await listTransactions({ type: 'INCOME' })

    expect(result.total).toBe(1)
    expect(result.items.map((t) => t.type)).toEqual(['INCOME'])
  })

  it('includes both boundary days in from and to', async () => {
    const { accountId, expenseId } = await fixtures()
    await db.transaction.createMany({
      data: [9, 10, 11, 12, 13].map((day) => ({
        description: `Dia ${day}`,
        amountCents: 100,
        type: 'EXPENSE' as const,
        date: new Date(Date.UTC(2026, 0, day, 12)),
        accountId,
        categoryId: expenseId,
      })),
    })

    const result = await listTransactions({
      from: new Date(Date.UTC(2026, 0, 10)),
      to: new Date(Date.UTC(2026, 0, 12)),
    })

    expect(result.items.map((t) => t.date.getUTCDate()).sort()).toEqual([
      10, 11, 12,
    ])
  })
})
