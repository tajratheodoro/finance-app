import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import {
  createInvestment,
  deleteInvestment,
  updateInvestment,
} from '@/features/investments/actions'
import {
  getInvestmentSummary,
  listInvestments,
} from '@/features/investments/queries'

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

const input = {
  name: 'Tesouro Selic',
  kind: 'FIXED_INCOME',
  institution: ' Nubank ',
  invested: '1.000,00',
  currentValue: '1.100,00',
}

describe('investments', () => {
  beforeEach(async () => {
    await db.investment.deleteMany()
    vi.clearAllMocks()
  })
  afterAll(() => db.$disconnect())

  it('createInvestment stores cents and revalidates', async () => {
    const result = await createInvestment(input)
    expect(result).toMatchObject({ ok: true })
    const id = result.ok ? result.data?.id : undefined
    expect(
      await db.investment.findUniqueOrThrow({ where: { id } }),
    ).toMatchObject({
      name: 'Tesouro Selic',
      kind: 'FIXED_INCOME',
      institution: 'Nubank',
      investedCents: 100000,
      currentValueCents: 110000,
    })
    expect(revalidatePath).toHaveBeenCalledWith('/investments')
  })

  it('createInvestment returns field errors and stores nothing when invalid', async () => {
    const result = await createInvestment({ ...input, invested: '0' })
    expect(result).toMatchObject({
      ok: false,
      fieldErrors: { invested: expect.any(Array) },
    })
    expect(await db.investment.count()).toBe(0)
  })

  it('updateInvestment changes values', async () => {
    const created = await db.investment.create({
      data: {
        name: 'X',
        kind: 'STOCK',
        investedCents: 100,
        currentValueCents: 100,
      },
    })
    const result = await updateInvestment(created.id, {
      ...input,
      kind: 'STOCK',
      institution: '',
    })
    expect(result).toMatchObject({ ok: true })
    expect(
      await db.investment.findUniqueOrThrow({ where: { id: created.id } }),
    ).toMatchObject({ institution: null, currentValueCents: 110000 })
    expect(revalidatePath).toHaveBeenCalledWith('/investments')
  })

  it('updateInvestment and deleteInvestment report a missing id', async () => {
    expect(await updateInvestment('nao-existe', input)).toMatchObject({
      ok: false,
      error: expect.stringContaining('não encontrado'),
    })
    expect(await deleteInvestment('nao-existe')).toMatchObject({
      ok: false,
      error: expect.stringContaining('não encontrado'),
    })
  })

  it('deleteInvestment removes the row', async () => {
    const created = await db.investment.create({
      data: {
        name: 'X',
        kind: 'FUND',
        investedCents: 100,
        currentValueCents: 100,
      },
    })
    expect(await deleteInvestment(created.id)).toEqual({ ok: true })
    expect(await db.investment.count()).toBe(0)
  })

  it('listInvestments orders by name and getInvestmentSummary aggregates', async () => {
    await db.investment.createMany({
      data: [
        {
          name: 'B',
          kind: 'STOCK',
          investedCents: 10000,
          currentValueCents: 15000,
        },
        {
          name: 'A',
          kind: 'FUND',
          investedCents: 10000,
          currentValueCents: 5000,
        },
      ],
    })
    expect((await listInvestments()).map((i) => i.name)).toEqual(['A', 'B'])
    const summary = await getInvestmentSummary()
    expect(summary).toMatchObject({
      investedCents: 20000,
      currentValueCents: 20000,
      returnPercent: 0,
    })
    expect(summary.allocation.map((a) => a.kind)).toEqual(['STOCK', 'FUND'])
  })
})
