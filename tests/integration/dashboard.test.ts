import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/lib/db'
import { parsePeriod } from '@/features/dashboard/period'
import {
  getExpensesByCategory,
  getMonthlySeries,
  getPeriodSummary,
  getTotalBalance,
} from '@/features/dashboard/queries'
import { resetDb } from '../helpers/db'

const at = (date: string) => new Date(`${date}T12:00:00.000Z`)

describe('dashboard queries', () => {
  beforeEach(resetDb)
  afterAll(() => db.$disconnect())

  it('returns zeros, not NaN, on an empty database', async () => {
    const january = parsePeriod('2026-01')

    expect(await getTotalBalance()).toBe(0)
    expect(await getPeriodSummary(january)).toEqual({
      incomeCents: 0,
      expenseCents: 0,
      balanceCents: 0,
    })
    expect(await getExpensesByCategory(january)).toEqual([])
    expect(await getMonthlySeries(january)).toHaveLength(6)
    expect(
      (await getMonthlySeries(january)).every((m) => m.incomeCents === 0),
    ).toBe(true)
  })

  it('counts a 31 Jan transaction in January and not in February', async () => {
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
        date: at('2026-01-31'),
        accountId: account.id,
        categoryId: category.id,
      },
    })

    expect((await getPeriodSummary(parsePeriod('2026-01'))).expenseCents).toBe(
      15000,
    )
    expect((await getPeriodSummary(parsePeriod('2026-02'))).expenseCents).toBe(
      0,
    )

    const series = await getMonthlySeries(parsePeriod('2026-02'))
    expect(series.find((m) => m.label === '2026-01')?.expenseCents).toBe(15000)
    expect(series.find((m) => m.label === '2026-02')?.expenseCents).toBe(0)
  })

  it('returns six months ending at the given period, zero-filled', async () => {
    const account = await db.account.create({
      data: { name: 'Carteira', type: 'WALLET' },
    })
    const salary = await db.category.create({
      data: { name: 'Salário', type: 'INCOME', color: '#0000ff' },
    })
    await db.transaction.create({
      data: {
        description: 'Salário março',
        amountCents: 100000,
        type: 'INCOME',
        date: at('2026-03-05'),
        accountId: account.id,
        categoryId: salary.id,
      },
    })

    const series = await getMonthlySeries(parsePeriod('2026-06'))

    expect(series.map((m) => m.label)).toEqual([
      '2026-01',
      '2026-02',
      '2026-03',
      '2026-04',
      '2026-05',
      '2026-06',
    ])
    expect(series[2]).toEqual({
      label: '2026-03',
      incomeCents: 100000,
      expenseCents: 0,
    })
    expect(series[3]).toEqual({
      label: '2026-04',
      incomeCents: 0,
      expenseCents: 0,
    })
  })

  it('sorts expenses by category by total, descending, ignoring income', async () => {
    const account = await db.account.create({
      data: { name: 'Nubank', type: 'CHECKING' },
    })
    const food = await db.category.create({
      data: { name: 'Alimentação', type: 'EXPENSE', color: '#111111' },
    })
    const transport = await db.category.create({
      data: { name: 'Transporte', type: 'EXPENSE', color: '#222222' },
    })
    const leisure = await db.category.create({
      data: { name: 'Lazer', type: 'EXPENSE', color: '#333333' },
    })
    const salary = await db.category.create({
      data: { name: 'Salário', type: 'INCOME', color: '#444444' },
    })
    const row = (
      categoryId: string,
      amountCents: number,
      type: 'INCOME' | 'EXPENSE',
    ) =>
      db.transaction.create({
        data: {
          description: 'x',
          amountCents,
          type,
          date: at('2026-01-10'),
          accountId: account.id,
          categoryId,
        },
      })
    await row(transport.id, 3000, 'EXPENSE')
    await row(food.id, 20000, 'EXPENSE')
    await row(food.id, 5000, 'EXPENSE')
    await row(leisure.id, 1000, 'EXPENSE')
    await row(salary.id, 900000, 'INCOME')

    const expenses = await getExpensesByCategory(parsePeriod('2026-01'))

    expect(expenses.map((e) => [e.name, e.totalCents])).toEqual([
      ['Alimentação', 25000],
      ['Transporte', 3000],
      ['Lazer', 1000],
    ])
  })

  it('adds initial balances, incomes, and expenses across all dates for the total balance', async () => {
    const account = await db.account.create({
      data: { name: 'Nubank', type: 'CHECKING', initialBalanceCents: 100000 },
    })
    const salary = await db.category.create({
      data: { name: 'Salário', type: 'INCOME', color: '#444444' },
    })
    const food = await db.category.create({
      data: { name: 'Alimentação', type: 'EXPENSE', color: '#111111' },
    })
    await db.transaction.create({
      data: {
        description: 'Salário',
        amountCents: 50000,
        type: 'INCOME',
        date: at('2025-12-05'),
        accountId: account.id,
        categoryId: salary.id,
      },
    })
    await db.transaction.create({
      data: {
        description: 'Mercado',
        amountCents: 20000,
        type: 'EXPENSE',
        date: at('2026-01-10'),
        accountId: account.id,
        categoryId: food.id,
      },
    })

    expect(await getTotalBalance()).toBe(130000)
    expect((await getPeriodSummary(parsePeriod('2026-01'))).balanceCents).toBe(
      -20000,
    )
  })
})
