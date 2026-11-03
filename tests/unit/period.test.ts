import { describe, expect, it } from 'vitest'
import { parsePeriod } from '@/features/dashboard/period'

describe('parsePeriod', () => {
  it('returns the half-open UTC range for a YYYY-MM month', () => {
    const period = parsePeriod('2026-01')

    expect(period.from).toEqual(new Date('2026-01-01T00:00:00.000Z'))
    expect(period.to).toEqual(new Date('2026-02-01T00:00:00.000Z'))
  })

  it.each(['abc', '2026-13', '2026-00', undefined])(
    'falls back to the month of now for %s',
    (month) => {
      const period = parsePeriod(month, new Date('2026-03-10T12:00:00.000Z'))

      expect(period.from).toEqual(new Date('2026-03-01T00:00:00.000Z'))
      expect(period.to).toEqual(new Date('2026-04-01T00:00:00.000Z'))
    },
  )
})
