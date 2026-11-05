import { describe, expect, it } from 'vitest'
import { evaluate, pressKey } from '@/features/registrar/calculator'

describe('evaluate', () => {
  it.each([
    ['75+50', 12500],
    ['10+5×2', 2000],
    ['100÷4', 2500],
    ['0,1+0,2', 30],
    ['7', 700],
    ['10−2,5', 750],
    ['2×3−10', -400],
    ['10÷3', 333],
  ])('%s gives %i cents', (expression, cents) => {
    expect(evaluate(expression)).toEqual({ ok: true, cents })
  })

  it('rejects division by zero', () => {
    expect(evaluate('5÷0')).toEqual({
      ok: false,
      error: 'Não é possível dividir por zero.',
    })
  })

  it('rejects an empty expression', () => {
    expect(evaluate('')).toMatchObject({ ok: false })
  })

  it('rejects a trailing operator', () => {
    expect(evaluate('5+')).toMatchObject({ ok: false })
  })
})

describe('pressKey', () => {
  it.each([
    ['0', '7', '7'],
    ['0', '0', '0'],
    ['5+0', '3', '5+3'],
    ['12', ',', '12,'],
    ['12,', ',', '12,'],
    ['12,34', '5', '12,34'],
    ['', ',', '0,'],
    ['5+', ',', '5+0,'],
    ['5+', '×', '5×'],
    ['0', '+', '0+'],
    ['', '+', ''],
    ['12', 'back', '1'],
    ['7', 'back', '0'],
    ['5+3', 'clear', '0'],
  ])('%s then %s gives %s', (expression, key, next) => {
    expect(pressKey(expression, key)).toBe(next)
  })
})
