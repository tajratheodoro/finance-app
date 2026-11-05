import { describe, expect, it } from 'vitest'
import { returnPercent, summarize } from '@/features/investments/summary'
import { investmentSchema } from '@/features/investments/schemas'

describe('returnPercent', () => {
  it('is the gain over the principal', () => {
    expect(returnPercent(100000, 110000)).toBeCloseTo(10)
    expect(returnPercent(100000, 80000)).toBeCloseTo(-20)
  })
  it('is 0 when nothing was invested', () => {
    expect(returnPercent(0, 5000)).toBe(0)
  })
})

describe('summarize', () => {
  it('totals and groups by kind, largest first', () => {
    const s = summarize([
      { kind: 'STOCK', investedCents: 100000, currentValueCents: 150000 },
      { kind: 'FUND', investedCents: 50000, currentValueCents: 50000 },
      { kind: 'STOCK', investedCents: 50000, currentValueCents: 50000 },
    ])
    expect(s.investedCents).toBe(200000)
    expect(s.currentValueCents).toBe(250000)
    expect(s.returnPercent).toBeCloseTo(25)
    expect(s.allocation).toEqual([
      { kind: 'STOCK', valueCents: 200000, percent: 80 },
      { kind: 'FUND', valueCents: 50000, percent: 20 },
    ])
  })
  it('handles an empty list without dividing by zero', () => {
    expect(summarize([])).toEqual({
      investedCents: 0,
      currentValueCents: 0,
      returnPercent: 0,
      allocation: [],
    })
  })
  it('gives 0% allocation when every value is zero', () => {
    const s = summarize([
      { kind: 'CRYPTO', investedCents: 100, currentValueCents: 0 },
    ])
    expect(s.allocation).toEqual([
      { kind: 'CRYPTO', valueCents: 0, percent: 0 },
    ])
  })
})

describe('investmentSchema', () => {
  const ok = {
    name: ' CDB ',
    kind: 'FIXED_INCOME',
    institution: '',
    invested: '1.000,00',
    currentValue: '0',
  }
  it('parses pt-BR amounts into cents', () => {
    expect(investmentSchema.parse(ok)).toEqual({
      name: 'CDB',
      kind: 'FIXED_INCOME',
      institution: null,
      investedCents: 100000,
      currentValueCents: 0,
    })
  })
  it('requires a positive principal', () => {
    expect(investmentSchema.safeParse({ ...ok, invested: '0' }).success).toBe(
      false,
    )
  })
  it('rejects negative current value and empty name', () => {
    expect(
      investmentSchema.safeParse({ ...ok, currentValue: '-1,00' }).success,
    ).toBe(false)
    expect(investmentSchema.safeParse({ ...ok, name: ' ' }).success).toBe(false)
  })
})
