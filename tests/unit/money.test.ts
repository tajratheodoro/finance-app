import { describe, expect, it } from 'vitest'
import { centsToInput, formatBrl, parseBrlToCents } from '@/lib/money'

describe('parseBrlToCents', () => {
  it.each([
    ['12,50', 1250],
    ['1.234,56', 123456],
    ['1234,5', 123450],
    ['7', 700],
  ])('parses %s', (input, cents) => {
    expect(parseBrlToCents(input)).toBe(cents)
  })

  it.each(['', '0', '0,00', '-5', '12.50', '12.5.6', 'abc'])(
    'rejects %s',
    (input) => {
      expect(parseBrlToCents(input)).toBeNull()
    },
  )

  it('accepts negative and zero when allowed', () => {
    expect(parseBrlToCents('-50,00', { allowNegative: true })).toBe(-5000)
    expect(parseBrlToCents('0', { allowZero: true })).toBe(0)
  })
})

describe('formatBrl', () => {
  it('formats cents as BRL', () => {
    expect(formatBrl(123456)).toBe('R$ 1.234,56')
  })
})

describe('centsToInput', () => {
  it.each([
    [-5000, '-50,00'],
    [0, '0,00'],
    [123456, '1234,56'],
  ])('writes %i cents as %s', (cents, text) => {
    expect(centsToInput(cents)).toBe(text)
  })

  it('round-trips through parseBrlToCents', () => {
    expect(
      parseBrlToCents(centsToInput(-5000), {
        allowNegative: true,
        allowZero: true,
      }),
    ).toBe(-5000)
  })
})
