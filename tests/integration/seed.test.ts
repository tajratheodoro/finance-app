import { afterAll, describe, expect, it } from 'vitest'
import { parsePeriod } from '@/features/dashboard/period'
import { getMonthlySeries } from '@/features/dashboard/queries'
import { db } from '@/lib/db'
import { seed } from '../../prisma/seed'

describe('seed', () => {
  afterAll(() => db.$disconnect())

  it('fills the last six months with income and expenses', async () => {
    await seed()

    const series = await getMonthlySeries(parsePeriod(undefined))

    expect(series).toHaveLength(6)
    for (const month of series) {
      expect(month.incomeCents).toBeGreaterThan(0)
      expect(month.expenseCents).toBeGreaterThan(0)
    }
  })
})
