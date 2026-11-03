import { describe, expect, it } from 'vitest'
import { transactionSchema } from '@/features/transactions/schemas'

const valid = {
  description: 'Supermercado',
  amount: '12,50',
  type: 'EXPENSE',
  date: '2026-01-31',
  accountId: 'acc_1',
  categoryId: 'cat_1',
}

describe('transactionSchema', () => {
  it('turns the amount into positive cents', () => {
    expect(transactionSchema.parse(valid).amountCents).toBe(1250)
  })

  it.each(['0', '-5', '12.50', ''])('rejects amount %j', (amount) => {
    const result = transactionSchema.safeParse({ ...valid, amount })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toEqual(['amount'])
  })

  it('stores the date at 12:00 UTC on the chosen day', () => {
    const { date } = transactionSchema.parse(valid)
    expect(date).toEqual(new Date('2026-01-31T12:00:00.000Z'))
  })

  it('rejects a date that does not exist', () => {
    const result = transactionSchema.safeParse({ ...valid, date: '2026-02-31' })
    expect(result.success).toBe(false)
  })

  it.each([
    ['description', ''],
    ['description', '   '],
    ['accountId', ''],
  ])('rejects an empty %s', (field, value) => {
    expect(
      transactionSchema.safeParse({ ...valid, [field]: value }).success,
    ).toBe(false)
  })
})
