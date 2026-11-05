import { describe, expect, it, vi } from 'vitest'
import { fromError } from '@/lib/action-result'
import { accountSchema } from '@/features/accounts/schemas'
import { categorySchema } from '@/features/categories/schemas'

describe('accountSchema', () => {
  it.each(['', '   '])('rejects an empty name %j', (name) => {
    const result = accountSchema.safeParse({ name, type: 'WALLET' })
    expect(result.success).toBe(false)
  })

  it('turns the initial balance into cents, allowing negatives', () => {
    const result = accountSchema.parse({
      name: 'Nubank',
      type: 'CHECKING',
      initialBalance: '-50,00',
    })
    expect(result.initialBalanceCents).toBe(-5000)
  })

  it('defaults the initial balance to zero', () => {
    const result = accountSchema.parse({ name: 'Carteira', type: 'WALLET' })
    expect(result.initialBalanceCents).toBe(0)
  })

  it('trims the institution', () => {
    const result = accountSchema.parse({
      name: 'Nubank',
      type: 'CHECKING',
      institution: '  Nubank ',
    })
    expect(result.institution).toBe('Nubank')
  })

  it.each([undefined, '', '   '])(
    'stores a missing institution %j as null',
    (institution) => {
      const result = accountSchema.parse({
        name: 'Carteira',
        type: 'WALLET',
        institution,
      })
      expect(result.institution).toBeNull()
    },
  )

  it('reports an unparseable initial balance on its own field', () => {
    const result = accountSchema.safeParse({
      name: 'Poupança',
      type: 'SAVINGS',
      initialBalance: 'abc',
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toEqual(['initialBalance'])
  })
})

describe('categorySchema', () => {
  it('rejects a color that is not #RRGGBB', () => {
    expect(
      categorySchema.safeParse({ name: 'Lazer', type: 'EXPENSE', color: 'red' })
        .success,
    ).toBe(false)
  })

  it('accepts a valid hex color', () => {
    expect(
      categorySchema.safeParse({
        name: 'Lazer',
        type: 'EXPENSE',
        color: '#1A2B3C',
      }).success,
    ).toBe(true)
  })
})

describe('fromError', () => {
  it('returns the known message for a Prisma code', () => {
    const result = fromError(
      { code: 'P2003' },
      { P2003: 'Esta conta tem transações.' },
    )
    expect(result).toEqual({ ok: false, error: 'Esta conta tem transações.' })
  })

  it('returns a generic message and logs anything unknown', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const result = fromError(new Error('boom'), {})
    expect(result).toEqual({
      ok: false,
      error: 'Algo deu errado. Tente novamente.',
    })
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })
})
