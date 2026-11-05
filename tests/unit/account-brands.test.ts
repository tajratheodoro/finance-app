import { describe, expect, it } from 'vitest'
import { getBrandStyle } from '@/features/accounts/brands'

describe('getBrandStyle', () => {
  it.each(['Nubank', ' nubank ', 'NU BANK'])(
    'matches %j to the Nubank card',
    (institution) => {
      expect(getBrandStyle(institution, 'CHECKING').wordmark).toBe('nubank')
    },
  )

  it('ignores accents when matching', () => {
    expect(getBrandStyle('Caixá', 'SAVINGS').wordmark).toBe('CAIXA')
  })

  it('falls back to the type style with no wordmark when there is no institution', () => {
    const style = getBrandStyle(null, 'CHECKING')
    expect(style.wordmark).toBeNull()
    expect(style.surface).toContain('bg-primary')
  })

  it('shows an unknown institution as plain text on the type style', () => {
    const style = getBrandStyle('Banco Inter', 'WALLET')
    expect(style.wordmark).toBe('Banco Inter')
    expect(style.surface).toContain('bg-card')
  })
})
